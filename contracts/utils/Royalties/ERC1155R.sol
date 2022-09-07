// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./ERC2981ContractWideRoyalties.sol";

contract My1155R is ERC1155, AccessControl, Pausable, ReentrancyGuard, ERC1155Burnable, ERC1155Supply, Ownable, ERC2981ContractWideRoyalties {

  /// The public name of this contract.
    string public constant name = "My1155R";
    string public constant symbol = "RT";

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant ADMIN_ROLE      = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE     = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE     = keccak256("MINTER_ROLE");

    bool private presaleEnded = false;

    uint32 private constant idPoppyLove = 1;
    address private poppyAddress;

    event TokenMinted(
        address owner,
        uint indexed tokenId,
        uint indexed amount
    );

    event TokensMintedBatch(
        address owner,
        uint[] indexed tokenIds,
        uint[] indexed amounts
    );

    event NewPriceSet(
        uint32 indexed tokenId,
        uint price
    );

    event NewSupplySet(
        uint32 indexed tokenId,
        uint32 supply
    );

    mapping (uint32 => uint256) private tokenPrice;
    mapping (uint32 => uint32) private tokenSupply;

    constructor() ERC1155("https://tokens.likida.io/PoppyLove/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Token limit
        tokenSupply[idPoppyLove] = 420;
        setPrice(idPoppyLove, 42000000000000000000);
    }

    // Likida PS functions
        function setPoppyAddress(address _newAddress) public onlyRole(ADMIN_ROLE){
            require(_newAddress != address(0), "Cant be set to address 0");
            poppyAddress = _newAddress;
            setRoyalties(_newAddress, 250);
        }

        function setPrice(uint32 _id, uint256 _price) public onlyRole(ADMIN_ROLE) {
            require(_id > 0, "Token id must be greater than 0");
            require(_price > 0, "Price must be greater than 0 wei");
            tokenPrice[_id] = _price;
            emit NewPriceSet(
                _id,
                _price
            );
        }

        function getPrice(uint32 _id) external view returns(uint256) {
            require(_id > 0, "Token id must be greater than 0");
            return tokenPrice[_id];
        }

        function setSupply(uint32 _id, uint32 _limit) public onlyRole(ADMIN_ROLE) {
            require(_id > 0, "Token id must be greater than 0");
            require(_limit > 0, "Limit must be greater than 0");
            tokenSupply[_id] = _limit;
            emit NewSupplySet(
                _id,
                _limit
            );
        }

        function getSupply(uint32 _id) external view returns(uint32) {
            require(_id > 0, "Token id must be greater than 0");
            return tokenSupply[_id];
        }

        function endPresale() public nonReentrant onlyRole(ADMIN_ROLE){
            presaleEnded = true;
        }

        function tokenMint(uint256 _id) public payable nonReentrant whenNotPaused {
            require(tokenSupply[uint32(_id)] > 0, "Token supply is under 1");
            require(tokenPrice[uint32(_id)] > 0, "Token price is under 1");
            require(msg.value == tokenPrice[uint32(_id)], "Please submit the asking price in order to complete the purchase");
            tokenSupply[uint32(_id)] -= 1;
            payable(poppyAddress).transfer(msg.value);
            _mint(msg.sender, _id, 1, "");

            emit TokenMinted(
                msg.sender,
                _id,
                1
            );
        }

        function tokenMintBatch(uint256[] memory ids, uint256[] memory amounts) public payable nonReentrant whenNotPaused {
            require(ids.length == amounts.length, "LPS: ids and amounts length mismatch");
            uint256 totalPrice = 0;

            for(uint256 i = 0; i < ids.length; i++){
                require(tokenSupply[uint32(ids[i])] >= amounts[i], "Token supply is under amount sent");
                totalPrice += amounts[i] * tokenPrice[uint32(ids[i])];
                tokenSupply[uint32(ids[i])] -= uint32(amounts[i]);
            }

            require(msg.value == totalPrice, "Total price isn't correct");

            payable(poppyAddress).transfer(msg.value);
            _mintBatch(msg.sender, ids, amounts, "");

            emit TokensMintedBatch(
                msg.sender,
                ids,
                amounts
            );
        }

        function withdraw() external nonReentrant onlyRole(ADMIN_ROLE) {
            payable(msg.sender).transfer(address(this).balance);
        }
    //

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        require(tokenSupply[uint32(id)] > amount, "Token supply is under the amount minting");
        tokenSupply[uint32(id)] -= uint32(amount);
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MINTER_ROLE) {
        for(uint256 i = 0; i < ids.length; i++){
            require(tokenSupply[uint32(ids[i])] >= amounts[i], "Token supply is under amount sent");
            tokenSupply[uint32(ids[i])] -= uint32(amounts[i]);
        }
        _mintBatch(to, ids, amounts, data);
    }

    function implements2981() external view returns(bool) {
        return this.supportsInterface(type(IERC2981Royalties).interfaceId);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        whenNotPaused
        override(ERC1155, ERC1155Supply) 
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Allows to set the royalties on the contract
    /// @param recipient the royalties recipient
    /// @param value royalties value (between 0 and 10000)
    function setRoyalties(address recipient, uint256 value) public onlyRole(ADMIN_ROLE){
        _setRoyalties(recipient, value);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl, ERC2981Base)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}