//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//ERCs
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./utils/IERC2981.sol";

// OZ controls
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Other imports
import "hardhat/console.sol";
import "./MarketStorage.sol";

/**
 * @title Likida Marketplace v1.0
 * @author EscuelaCryptoES
 * @notice A marketplace for Likida users (buy & sell with bidding)
 */
contract LikidaMarket is IERC721Receiver, ERC1155Holder, Pausable, AccessControl, ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter public _tokenIdCounter;
  Counters.Counter public _itemsSold;

  // Roles
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");

  mapping(uint256=>MarketStorage.MarketItem) private _idToMarketItem;

  uint16          public fees;
  address payable public feeReceiver;

  /**
   * @notice This modifier checks if offerId is valid and offer is not sold
   * @param offerId The offer ID
   */
  modifier validItem(uint256 offerId) {
    require(
      offerId <= _tokenIdCounter.current(), 
      "LKMKT: Please, use a valid item"
    );
    require(
      _idToMarketItem[offerId].owner == address(0), 
      "LKMKT: Offer already sold"
    );
    _;
  }

  /**
   * @notice This modifier checks if the caller is the seller of that item
   * @param offerId The offer ID
   */
  modifier isSeller(uint256 offerId){
    require(
      _idToMarketItem[offerId].seller == msg.sender,
      "LKMKT: Caller is not the seller"
    );
    _;
  }

  /**
   * @notice This modifier checks if sender is the bidder of the offer
   * @param offerId The offer ID
   */
  modifier isBidder(uint256 offerId) {
    require(
      _idToMarketItem[offerId].bidder == msg.sender,
      "LKMKT: Caller is not the bidder"
    );
    _;
  }

  /**
   * @notice Called when an user make an offer and to check if an offer is in bidding
   * @param offer A boolean to switch this function from make-to-check
   * @param offerId The offer ID
   * @param price New price for offer
   */
  modifier inBidding(bool offer, uint256 offerId, uint256 price) {
    if(offer){
      require(
        price >= _idToMarketItem[offerId].price,
        "LKMKT: Price must be greater"
      );
    }
    require(
      msg.sender != address(0),
      "LKMKT: Sender is zero address"
    );
    require(
      _idToMarketItem[offerId].inBidding,
      "LKMKT: Offer isn't in bidding"
    );
    _;
  }

  // IERC721Receiver
  event Received721(address _operator, address _from, uint256 _tokenId, bytes _data);

  // IERC1155Receiver
  event Received1155(address operator, address from, uint256 id, uint256 value, bytes data);
  event Received1155Batch(address operator, address from, uint256[] ids, uint256[] values, bytes data);

  // Market events
  event OfferAdded(uint256 indexed tokenId, address indexed seller, uint256 price, bool inBidding);
  event OfferSold(address indexed buyer, uint256 indexed offerId, MarketStorage.Token token, uint256 price);
  event OfferRetired(address indexed seller, uint256 indexed offerId, MarketStorage.Token token);
  event IndividualSold(address indexed buyer, uint256 indexed offerId, MarketStorage.Token token, uint256 price, uint256 amount);
  event OfferMade(address indexed bidder, uint256 indexed offerId, uint256 price);
  event OfferCanceled(address indexed canceler, uint256 indexed offerId);
  event OfferAccepted(address indexed bidder, uint256 indexed offerId, MarketStorage.Token token, uint256 price);

  /**
   * @notice The constructor of the market, sets roles and fees
   * @param fees_ The % for fees in basis points
   * @param feeReceiver_ The address to receive all the fees
   */
  constructor(uint16 fees_, address feeReceiver_) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, msg.sender);
    _grantRole(ADMIN_ROLE, msg.sender);

    fees = fees_;
    feeReceiver = payable(feeReceiver_);
  }

  /**
   * @notice Checks if the contract Address supports a type of interface
   * @param contractAddress The contract address of the token
   * @param type_ The type of interface to check
   * @return implemented A boolean response to make other stuff in callback
   */
  function supportInterface(address contractAddress, bytes4 type_) private view returns(bool) {
    return IERC165(contractAddress).supportsInterface(type_);
  }

  /**
   * @notice Pays the royalties to the royalty recipient if the contract implements ERC2981
   * @param contractAddress The contract address of the token
   * @param tokenId The ID of the token
   * @param amount The total of the sell to receive the result of royalties
   * @return royaltyFee The royalty total price to be substracted for the seller
   */
  function _royaltyPay(address contractAddress, uint256 tokenId, uint256 amount) private returns(uint256){
    uint256 royalty = 0;
    if(supportInterface(contractAddress, type(IERC2981).interfaceId)){
      (address royRec, uint256 royAmount) = IERC2981(contractAddress).royaltyInfo(tokenId, amount);
      royalty = royAmount;
      payable(royRec).transfer(royAmount);
    }
    return royalty;
  }

  /**
   * @notice Transfers a NFT to an user, no matter the type
   * @param token The token info stored in marketplace
   * @param from The owner
   * @param to Who will receive it
   * @param data An extra data for 1155 function
   */
  function _transferNFT(MarketStorage.Token memory token, address from, address to, bytes memory data) private {
    if(token.is1155){
      IERC1155(token.contractAddress).safeTransferFrom(from, to, token.tokenId, token.amount, data);
    }
    else{
      IERC721(token.contractAddress).safeTransferFrom(from, to, token.tokenId);
    }
  }

  /**
   * @notice Setter for fees percentage in BP
   * @param newFees The new percentage in BP for fees
   */
  function setFees(uint16 newFees) external onlyRole(ADMIN_ROLE) {
    fees = newFees;
  }

  /**
   * @notice Setter for fees receiver address
   * @param newFeeReceiver The new address to receive fees marketplace sells  
   */
  function setFeeReceiver(address newFeeReceiver) external onlyRole(ADMIN_ROLE) {
    feeReceiver = payable(newFeeReceiver);
  }

  /**
   * @notice Store an offer in mapping with NFT transfer to marketplace
   * @param tokenId The token ID in its contract
   * @param contractAddress The address of the contract of the token
   * @param price The price to sell it, if 0 the offer is in bidding
   * @param amount The amount of tokens if is 1155 (for 721 no matter)
   * @param data The data extra param for 1155 
   */
  function putOnSale(uint256 tokenId, address contractAddress, uint256 price, uint256 amount, bytes calldata data) external whenNotPaused nonReentrant{
    // Token stuff
    MarketStorage.Token memory token;
    token.contractAddress = contractAddress;
    token.tokenId = tokenId;

    if(supportInterface(contractAddress, type(IERC721).interfaceId)){
      IERC721(contractAddress).safeTransferFrom(msg.sender, address(this), tokenId);
      token.is1155 = false;
      token.amount = 1;
    }
    else if(supportInterface(contractAddress, type(IERC1155).interfaceId)){
      //!!!!!!!!!!!!!!!!!!!!!!!! TODO: Approve is forever?
      IERC1155(contractAddress).safeTransferFrom(msg.sender, address(this), tokenId, amount, data);
      token.is1155 = true;
      token.amount = amount;
    }
    else{
      //TODO: Ver como revertir esto sin que saque Transaction reverted: function returned an unexpected amount of data cuando no es ni 721 ni 1155
      revert("LKMKT: Neither 721 nor 1155");
    }

    // Sets offer
    MarketStorage.MarketItem memory item;

    item.offerId = _tokenIdCounter.current();
    item.price  = price;
    item.seller = msg.sender;
    item.token  = token;
    item.inBidding = (price == 0) ? true : false;

    // Store offer into marketplace & emitted
    _idToMarketItem[_tokenIdCounter.current()] = item;
    _tokenIdCounter.increment();
    emit OfferAdded(item.offerId, item.seller, item.price, item.inBidding);
  }

  /**
   * @notice Retire stored offer by the seller if is valid and don't have bidder
   * @param offerId The offer ID stored in mapping struct
   * @param data Extra param for 1155
   */
  function retireOffer(uint256 offerId, bytes calldata data) external whenNotPaused nonReentrant validItem(offerId) isSeller(offerId) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    require(offer.bidder == address(0) && !offer.inBidding, "LKMKT: Offer has bidder");
    
    // Retire stored & emitted
    offer.owner = offer.seller;
    emit OfferRetired(offer.seller, offer.offerId, offer.token);
    
    // Transfer back to seller its NFT
    _transferNFT(offer.token, address(this), offer.seller, data);
  }

  /**
   * @notice Function to buy an open offer
   * @param offerId The offer ID to buy
   * @param data Extra param for 1155
   */
  function buyOffer(uint256 offerId, bytes calldata data) external payable whenNotPaused nonReentrant validItem(offerId) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    
    // Total of 1155 
    uint256 totalPrice = (offer.token.is1155) ? offer.token.amount * offer.price : offer.price;
    require(msg.value == totalPrice, "LKMKT: Send the correct price");
    require(!offer.inBidding, "LKMKT: Offer is in bidding");
    
    // Sell stored & emitted
    offer.owner = msg.sender;
    _itemsSold.increment();
    emit OfferSold(msg.sender, offerId, offer.token, offer.price);

    // Money distribution
    uint256 likidaFee = calculatePercentage(totalPrice, fees);
    uint256 royaltyFee = _royaltyPay(offer.token.contractAddress, offer.token.tokenId, totalPrice);

    payable(feeReceiver).transfer(likidaFee);
    payable(offer.seller).transfer(totalPrice - likidaFee - royaltyFee);
    
    // Transfer token to buyer
    _transferNFT(offer.token, address(this), msg.sender, data);
    offer.token.amount = 0;
  }

  /**
   * @notice Function to buy an open offer but ONLY if its 1155 AND in parts
   * @param offerId The offer ID of 1155
   * @param amount The requested amount by the buyer
   * @param data Extra param for 1155
   */
  function buyByAmount(uint256 offerId, uint256 amount, bytes calldata data) external payable whenNotPaused nonReentrant validItem(offerId) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];

    require(offer.token.is1155, "LKMKT: Not 1155");
    require(amount < offer.token.amount, "LKMKT: call buyOffer for buy all");
    require(!offer.inBidding, "LKMKT: Offer is in bidding");

    // Price stuff
    uint256 totalPrice = amount * offer.price;
    require(msg.value == totalPrice, "LKMKT: Send the correct price");

    // Sell stored & emitted
    offer.token.amount -= amount;
    emit IndividualSold(msg.sender, offerId, offer.token, offer.price, amount);

    // Money distribution
    uint256 likidaFee = calculatePercentage(totalPrice, fees);
    uint256 royaltyFee = _royaltyPay(offer.token.contractAddress, offer.token.tokenId, totalPrice);
    
    payable(feeReceiver).transfer(likidaFee);
    payable(offer.seller).transfer(totalPrice - likidaFee - royaltyFee);

    // Transfer x NFTs for buyer
    IERC1155(offer.token.contractAddress).safeTransferFrom(address(this), msg.sender, offer.token.tokenId, amount, data);
  }

  /**
   * @notice Allows the seller to change its offer
   * @param offerId The offer ID to modify
   * @param price The new price, if its 0, offer will be changed_ to in bidding
   * !!!!!!!!!!!!!!!!!!!!!!!! @dev Check this function in all probabilities, avoid an offer can be sold at 0
   */
  function modifyOfferBySeller(uint256 offerId, uint256 price) external whenNotPaused validItem(offerId) isSeller(offerId) {
    require(!_idToMarketItem[offerId].inBidding, "LKMKT: Offer is in bidding");
    _idToMarketItem[offerId].price = price;
    if(price == 0){
      _idToMarketItem[offerId].bidder = address(0);
      _idToMarketItem[offerId].inBidding = true;
    }
  }

  /**
   * @notice Allows the seller to change an open offer to in bidding
   * @param offerId The offer ID to modify
   * @param bidding A boolean var to change inBidding attr.
   *!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! @dev This function is very dangerous, check it again with the previous function too
   */
  function changeState(uint256 offerId, bool bidding) external whenNotPaused validItem(offerId) isSeller(offerId) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    require(offer.price != 0, "LKMKT: Price must be greater");
    require(offer.bidder == address(0), "LKMKT: Shoudn't have a bidder");

    offer.inBidding = bidding;
    if(bidding) offer.price = 0;
  }

  /**
   * @notice Stores an offer for an offer in bidding
   * @param offerId The offer ID for make an offer
   */
  function makeOffer(uint256 offerId) external payable whenNotPaused validItem(offerId) inBidding(true, offerId, msg.value) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    uint256 price = msg.value / offer.token.amount;
    offer.bidder = msg.sender;
    offer.price = price;
    emit OfferMade(msg.sender, offerId, price);
  }

  /**
   * @notice Cancel an offer in bidding by seller or bidder
   * @param offerId The offer ID to cancel
   */
  function cancelOffer(uint256 offerId) external nonReentrant whenNotPaused validItem(offerId) inBidding(false,offerId,0) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    emit OfferCanceled(msg.sender, offerId);

    uint256 totalPrice = (offer.token.is1155) ? offer.token.amount * offer.price : offer.price;

    if(offer.seller == msg.sender || offer.bidder == msg.sender){
      address bidder = offer.bidder;

      offer.price = 0;
      offer.bidder = address(0);
      payable(bidder).transfer(totalPrice);
    }
    else{
      revert("LKMKT: Neither seller nor bidder");
    }
  }

  /**
   * @notice Fuction that allows to seller accept its offer
   * @param offerId The offer ID to accept
   * @param data Extra data param for 1155
   */
  function acceptOffer(uint256 offerId, bytes memory data) external nonReentrant whenNotPaused validItem(offerId) inBidding(false,offerId,0) isSeller(offerId) {
    MarketStorage.MarketItem storage offer = _idToMarketItem[offerId];
    uint256 totalPrice = (offer.token.is1155) ? offer.token.amount * offer.price : offer.price;

    require(offer.bidder != address(0), "LKMKT: Offer doesn't have bidder");
    offer.owner = offer.bidder;
    _itemsSold.increment();

    emit OfferAccepted(offer.bidder, offerId, offer.token, offer.price);

    // Money distribution
    uint256 likidaFee = calculatePercentage(totalPrice, fees);
    uint256 royaltyFee = _royaltyPay(offer.token.contractAddress, offer.token.tokenId, totalPrice);

    payable(feeReceiver).transfer(likidaFee);
    payable(offer.seller).transfer(totalPrice - likidaFee - royaltyFee);

    _transferNFT(offer.token, address(this), offer.bidder, data);
  }

  /**
   * @notice Retrieve all the market offers
   * @return items An MarketItem array with all the offers
   */
  function getAllMarketItems() external view returns (uint256[] memory items) {
    uint256 itemCount = _tokenIdCounter.current();
    for(uint256 i = 0; i < itemCount; i++) items[i] = i;
    return items;
  }

  /**
   * @notice Retrieve all the market offers not sold
   * @return items An MarketItem array with all the offers not sold
   *!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! @dev Change to uint[]
   */
  function getAllMarketItemsNotSold() external view returns(MarketStorage.MarketItem[] memory) {
    uint256 itemCount       = _tokenIdCounter.current();
    uint256 unSoldItemCount = itemCount - _itemsSold.current();
    MarketStorage.MarketItem[] memory items = new MarketStorage.MarketItem[](unSoldItemCount);

    for(uint256 i = 0; i < itemCount; i++) {
      MarketStorage.MarketItem memory currentItem = _idToMarketItem[i];
      if(currentItem.owner == address(0)){
        items[i] = currentItem;
      }
    }
    return items;
  }

  /**
   * @notice Retrieve all the market offers in bidding by owner
   * @param owner The address of the owner to check its offers in bidding
   * @return items An MarketItem array with all the offers in bidding from one owner
   *!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! @dev Change to uint[]
   */
  function getOffersInBiddingByOwner(address owner) external view returns(MarketStorage.MarketItem[] memory) {
    uint256 itemCount       = _tokenIdCounter.current();
    uint256 unSoldItemCount = itemCount - _itemsSold.current();
    MarketStorage.MarketItem[] memory items = new MarketStorage.MarketItem[](unSoldItemCount);

    for(uint256 i = 0; i < itemCount; i++) {
      if(_idToMarketItem[i].inBidding && _idToMarketItem[i].seller == owner){
        MarketStorage.MarketItem memory currentItem = _idToMarketItem[i];
        items[i] = currentItem;
      }
    }

    return items;
  }

  /**
   * @notice Retrieve all the market offers in bidding
   * @return items An MarketItem array with all the offers in bidding
   *!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! @dev Change to uint[]
   */
  function getOffersInBidding() external view returns(MarketStorage.MarketItem[] memory) {
    uint256 itemCount       = _tokenIdCounter.current();
    uint256 unSoldItemCount = itemCount - _itemsSold.current();
    MarketStorage.MarketItem[] memory items = new MarketStorage.MarketItem[](unSoldItemCount);

    for(uint256 i = 0; i < itemCount; i++) {
      if(_idToMarketItem[i].inBidding){
        MarketStorage.MarketItem memory currentItem = _idToMarketItem[i];
        items[i] = currentItem;
      }
    }

    return items;
  }

  /**
   * @notice Retrieve an offer
   * @param offerId The offer ID to search
   * @return offer Offer data
   */
  function getOffer(uint256 offerId) external view returns(MarketStorage.MarketItem memory) {
    return _idToMarketItem[offerId];
  }

  /**
   * @notice Calculate the percentage of the total order price
   * @param number The total price
   * @param percentage Percentage in basis points
   * @return partOf The percentage (percentage) of total (number)
   */
  function calculatePercentage(uint256 number, uint256 percentage) private pure returns(uint256) {
    return number * percentage / 10000;
  }

  // EXTRA FUNCTIONS

  /**
   * @dev inherit doc from IERC721Receiver
   */
  function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes calldata _data) external override returns(bytes4) {
    emit Received721(_operator, _from, _tokenId, _data);
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  /**
   * @dev inherit doc from ERC1155Holder
   */
  function onERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes memory data
  ) public override returns (bytes4){
    emit Received1155(operator, from, id, value, data);
    return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
  }

  /**
   * @dev inherit doc from ERC1155Holder
   */
  function onERC1155BatchReceived(
    address operator,
    address from,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) public override returns (bytes4) {
    emit Received1155Batch(operator, from, ids, amounts, data);
    return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
  }

  // Required by Solidity
  function supportsInterface(bytes4 interfaceId)
  public
  view
  override(ERC1155Receiver, AccessControl)
  returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}