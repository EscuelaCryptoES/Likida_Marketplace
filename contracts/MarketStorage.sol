//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library MarketStorage{
    struct Token {
        uint256 tokenId;
        uint256 amount;
        address contractAddress;
        bool    is1155;
    }

    struct MarketItem {
        Token   token;
        uint256 offerId;
        uint256 price;
        address seller;
        address owner;
        address bidder;
        bool    inBidding;
    }
}