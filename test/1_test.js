const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const fee = 5;

const Errores = {
  1 : "LKMKT: Please, use a valid item"
}
Object.freeze(Errores);


describe("Deploy", function () {
  this.beforeAll(async function(){
    try{
      provider = waffle.provider;
      [owner,u1,u2,royaltiesReceiver,feeReceiver] = await ethers.getSigners();

      //Market
      const LikidaMarket = await ethers.getContractFactory("LikidaMarket");
      likidaMarket = await LikidaMarket.deploy(fee * 100, feeReceiver.address);
      await likidaMarket.deployed();
      console.log("Likida Market SC deployed on " + likidaMarket.address)

      //721 Dummy
      const __721 = await ethers.getContractFactory("My721");
      _721 = await __721.deploy();
      await _721.deployed();
      console.log("721 Dummy SC deployed on " + _721.address)

      //1155 Dummy
      const __1155 = await ethers.getContractFactory("My1155");
      _1155 = await __1155.deploy();
      await _1155.deployed();
      console.log("1155 Dummy SC deployed on " + _1155.address)

      //721R Dummy
      const __721R = await ethers.getContractFactory("My721R");
      _721R = await __721R.deploy();
      await _721R.deployed();
      console.log("721R Dummy SC deployed on " + _721R.address)

      //1155R Dummy
      const __1155R = await ethers.getContractFactory("My1155R");
      _1155R = await __1155R.deploy();
      await _1155R.deployed();
      console.log("1155R Dummy SC deployed on " + _1155R.address)
    } 
    catch(ex){
      console.error(ex);
    }
  })
  it("Deployed all contracts", async function () {
  });
});

// Test suite ERC721
describe("721 Dummy", function(){
  it("Mint 200 721 to Owner", async function(){
    for (let index = 0; index < 200; index++) {
      await expect(_721.safeMint(owner.address),"mint 721 to owner").to.emit(_721, "Mint");
    }
    const expected = 200;
    const realValue = await _721.balanceOf(owner.address);
    expect(realValue).to.equal(expected);
  });

  it("Transfer to likidaMarket token 1", async function(){
    const expectedbefore = 0;
    const realbefore = await _721.balanceOf(likidaMarket.address);
    expect(realbefore).to.equal(expectedbefore);

    await expect(_721["safeTransferFrom(address,address,uint256)"](owner.address, likidaMarket.address, 1),'transfer to market').to.emit(likidaMarket, "Received721");

    const expectedafter = 1;
    const realafter = await _721.balanceOf(likidaMarket.address);
    expect(realafter).to.equal(expectedafter);
  });
});

// Test suite ERC1155
describe("1155 Dummy", function(){
  it("Mint 200 of 0,1,2 from 1155 to Owner", async function(){
    const ids = [ 0, 1, 2 ]
    const amounts = [ 200, 200, 200 ]; 

    await expect(_1155.mintBatch(owner.address, ids, amounts, "0x00"),"mint 1155 to owner").to.emit(_1155, "BatchMinted");
    const expected = 200;

    const realValue0 = await _1155.balanceOf(owner.address,0);
    const realValue1 = await _1155.balanceOf(owner.address,1);
    const realValue2 = await _1155.balanceOf(owner.address,2);

    expect(realValue0).to.equal(expected);
    expect(realValue1).to.equal(expected);
    expect(realValue2).to.equal(expected);
  });

  it("NO BATCH: Transfer 10 of 0,1,2 to LikidaMarket", async function(){
    const expected1 = 0;
    const likidaBalance0 = await _1155.balanceOf(likidaMarket.address, 0);
    const likidaBalance1 = await _1155.balanceOf(likidaMarket.address, 1);
    const likidaBalance2 = await _1155.balanceOf(likidaMarket.address, 2);

    expect(likidaBalance0).to.equal(expected1);
    expect(likidaBalance1).to.equal(expected1);
    expect(likidaBalance2).to.equal(expected1);

    await expect(_1155.safeTransferFrom(owner.address, likidaMarket.address, 0, 10, "0x00"),'Transfer 0-10').to.emit(likidaMarket, "Received1155");
    await expect(_1155.safeTransferFrom(owner.address, likidaMarket.address, 1, 10, "0x00"),'Transfer 1-10').to.emit(likidaMarket, "Received1155");
    await expect(_1155.safeTransferFrom(owner.address, likidaMarket.address, 2, 10, "0x00"),'Transfer 2-10').to.emit(likidaMarket, "Received1155");

    const expectedAfter = 10;
    const likidaBalanceAfter0 = await _1155.balanceOf(likidaMarket.address, 0);
    const likidaBalanceAfter1 = await _1155.balanceOf(likidaMarket.address, 1);
    const likidaBalanceAfter2 = await _1155.balanceOf(likidaMarket.address, 2);

    expect(likidaBalanceAfter0).to.equal(expectedAfter);
    expect(likidaBalanceAfter1).to.equal(expectedAfter);
    expect(likidaBalanceAfter2).to.equal(expectedAfter);
  });

  it("BATCH: Transfer 10 of 0,1,2 to LikidaMarket", async function(){
    const expected1 = 10;
    const likidaBalance0 = await _1155.balanceOf(likidaMarket.address, 0);
    const likidaBalance1 = await _1155.balanceOf(likidaMarket.address, 1);
    const likidaBalance2 = await _1155.balanceOf(likidaMarket.address, 2);

    expect(likidaBalance0).to.equal(expected1);
    expect(likidaBalance1).to.equal(expected1);
    expect(likidaBalance2).to.equal(expected1);

    const ids = [ 0, 1, 2 ];
    const amounts = [ 10, 10, 10 ];

    await expect(_1155.safeBatchTransferFrom(owner.address, likidaMarket.address, ids, amounts, "0x00"),'BATCH: Transfer 10 of 0,1,2').to.emit(likidaMarket, "Received1155Batch");

    const expectedAfter = 20;
    const likidaBalanceAfter0 = await _1155.balanceOf(likidaMarket.address, 0);
    const likidaBalanceAfter1 = await _1155.balanceOf(likidaMarket.address, 1);
    const likidaBalanceAfter2 = await _1155.balanceOf(likidaMarket.address, 2);

    expect(likidaBalanceAfter0).to.equal(expectedAfter);
    expect(likidaBalanceAfter1).to.equal(expectedAfter);
    expect(likidaBalanceAfter2).to.equal(expectedAfter);
  });
});

describe("721 w/ Royalties", function(){
  it("Should set royalties at 5% for royaltiesReceiver", async function(){
    const precio_venta = ethers.utils.parseEther("1");
    const r = fee * 100; //5.00%
    
    const exp_a = royaltiesReceiver.address;
    const exp_r = parseInt(precio_venta) * r / 10000;
    
    await expect(_721R.setRoyalties(royaltiesReceiver.address, r),'Set royalties').not.to.be.reverted;
    const real = await _721R.royaltyInfo(0,precio_venta);

    expect(exp_a,'Royalties receiver').to.equal(real.receiver);
    expect(exp_r,'Royalties amount').to.equal(parseInt(real.royaltyAmount))
  });

  it("Mint 200 721R to Owner", async function(){
    for (let index = 0; index < 200; index++) {
      await expect(_721R.safeMint(owner.address),"mint 721R to owner").to.emit(_721R, "Mint");
    }
    const expected = 200;
    const realValue = await _721R.balanceOf(owner.address);
    expect(realValue).to.equal(expected);
  });

});

describe ("1155 w/ Royalties", function(){
  it("Should set royalties at 5% for royaltiesReceiver", async function(){
    const precio_venta = ethers.utils.parseEther("1");
    const r = fee * 100; //5.00%
    
    const exp_a = royaltiesReceiver.address;
    const exp_r = parseInt(precio_venta) * r / 10000;
    
    await expect(_1155R.setRoyalties(royaltiesReceiver.address, r),'Set royalties').not.to.be.reverted;
    const real = await _1155R.royaltyInfo(0,precio_venta);

    expect(exp_a,'Royalties receiver').to.equal(real.receiver);
    expect(exp_r,'Royalties amount').to.equal(parseInt(real.royaltyAmount))
  });

  it("Mint 200 of 1 from 1155 to Owner", async function(){
    const ids = [ 1 ]
    const amounts = [ 200 ];

    await expect(_1155R.mintBatch(owner.address, ids, amounts, "0x00"),"mint 1155 to owner").not.to.be.reverted;
    const expected = 200;

    const realValue1 = await _1155R.balanceOf(owner.address,1);

    expect(expected).to.equal(realValue1);
  });
});

//Test suite Likida Marketplace
describe("Likida Market Test Suite (before fees imp)", function(){
  it("OFFER 0: putOnSale in bidding one ERC721 token", async function(){
    await expect(_721.connect(owner).approve(likidaMarket.address, 2),'Approve').not.to.be.reverted;
    await expect(likidaMarket.connect(owner).putOnSale(2, _721.address, 0, 0, "0x00"),'PutOnSale 721').to.emit(likidaMarket, "OfferAdded");
    expect(await _721.ownerOf(2),'Check: 721 in marketplace').to.equal(likidaMarket.address);
  })
  
  it("OFFER 1: putOnSale in bidding one ERC1155-1 token", async function(){
    const precio = ethers.utils.parseEther("2");
    await expect(_1155.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
    await expect(likidaMarket.connect(owner).putOnSale(1, _1155.address, precio, 4, "0x00"),'PutOnSale 1155').to.emit(likidaMarket, "OfferAdded");
    expect(await _1155.balanceOf(likidaMarket.address, 1),'Check: 1155 in marketplace').to.equal(24);
  });
  
  it("Owner checks offers in bidding", async function(){
    const expected_result = [ 0 ];
    let real_result = [];
    const allOffers = await likidaMarket.getOffersInBiddingByOwner(owner.address);
    allOffers.forEach(element => {
      if(element.inBidding) { real_result.push(parseInt(element.offerId)); }
    })
    expect(expected_result,'Items in bidding').to.have.all.members(real_result);
  });

  it("Should revert when U1 try to buy offer 0 price 0", async function(){
    await expect(likidaMarket.connect(u1).buyOffer(0, ethers.utils.parseEther("0"))).to.be.revertedWith("LKMKT: Offer is in bidding");
  })

  it("Should revert when owner try to put a price to an offer NOT IN Bidding", async function(){
    const precio = 3;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(owner).makeOffer(1, val)).to.be.revertedWith("LKMKT: Offer isn't in bidding");
  });
  
  it("Owner should change price to offer 0", async function(){
    const precio = 5;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(owner).makeOffer(0,val),'Owner change price to offer 0').not.to.be.reverted;
  })

  it("Should revert when U1 try to put an cheaper offer for offer 0", async function(){
    const precio = 1;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(u1).makeOffer(0,val),'REVERT: price is less than actual').to.be.revertedWith("LKMKT: Price must be greater");
  });

  it("U1 makes an offer for 0 checking balances of $MATIC", async function(){
    let balance = await provider.getBalance(u1.address);
    let before = ethers.utils.formatEther(balance.toString());

    const precio = 8;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(u1).makeOffer(0,val),'U1 makes an offer for 0').to.emit(likidaMarket, "OfferMade");

    balance = await provider.getBalance(u1.address);
    let after = ethers.utils.formatEther(balance.toString());

    expect(parseInt(before) - precio,'Check balance after make an offer').to.equal(parseInt(after));
  });

  it("Should revert when U2 try to cancel offer from U1", async function(){
    await expect(likidaMarket.connect(u2).cancelOffer(1),'REVERT: Offer not in bidding').to.be.revertedWith("LKMKT: Offer isn't in bidding");
    await expect(likidaMarket.connect(u2).cancelOffer(3),'REVERT: not exist ID').to.be.revertedWith("LKMKT: Please, use a valid item");
    await expect(likidaMarket.connect(u2).cancelOffer(0),'REVERT: U2 isnt owner nor bidder').to.be.revertedWith("LKMKT: Neither seller nor bidder");
  });

  it("U1 cancel his offer checking balances of $MATIC", async function(){
    let balance = await provider.getBalance(u1.address);
    let before = ethers.utils.formatEther(balance.toString());

    let precio = await likidaMarket.getOffer(0);
    precio = ethers.utils.formatEther((precio.price).toString());

    await expect(likidaMarket.connect(u1).cancelOffer(0),'U1 cancel his offer').to.emit(likidaMarket, "OfferCanceled");

    balance = await provider.getBalance(u1.address);
    let after = ethers.utils.formatEther(balance.toString());

    expect(parseInt(before) + parseInt(precio),'Check balance after cancel offer').to.equal(parseInt(after))
  });

  it("Owner cancel his offer checking final price in blockchain", async function(){
    let balance = await provider.getBalance(owner.address);
    let before = ethers.utils.formatEther(balance.toString());

    await expect(likidaMarket.connect(owner).changeState(1, true),'Put in bidding offer 1 by owner').not.to.be.reverted;
    await expect(likidaMarket.connect(owner).cancelOffer(1),'U1 cancel his offer').to.emit(likidaMarket, "OfferCanceled");
    
    let precio = await likidaMarket.getOffer(1);
    precio = ethers.utils.formatEther((precio.price).toString());
    
    balance = await provider.getBalance(owner.address);
    let after = ethers.utils.formatEther(balance.toString());

    expect(parseInt(before),'owner : Check balance after cancel offer').to.equal(parseInt(after))
    expect(0,'owner : Check balance after cancel offer').to.equal(parseInt(precio))
  });

  it("U2 makes an offer for item 1", async function(){
    let balance = await provider.getBalance(u2.address);
    let before = ethers.utils.formatEther(balance.toString());

    const offer = await likidaMarket.getOffer(1);
    const amount = parseInt(offer.token.amount); 
    const precio = 8 * amount;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(u2).makeOffer(1,val),'u2 makes an offer for 0').to.emit(likidaMarket, "OfferMade");

    balance = await provider.getBalance(u2.address);
    let after = ethers.utils.formatEther(balance.toString());

    expect(parseInt(before) - precio,'Check balance after make an offer').to.equal(parseInt(after));
  });

  it("Owner accept offer 1 for U2", async function(){
    // Balance MATIC
    let balance = await provider.getBalance(owner.address);
    let before = ethers.utils.formatEther(balance.toString());

    // Balance 1155 u2
    let balance1155 = await _1155.balanceOf(u2.address, 1);

    let offerAccepted = await likidaMarket.getOffer(1);
    let offerAmount = parseInt(offerAccepted.token.amount);
    let offerPrice = parseInt(ethers.utils.formatEther((offerAccepted.price).toString()));
    const totalPrice = offerPrice * offerAmount

    await expect(likidaMarket.connect(owner).acceptOffer(1, "0x00"),'Owner accept offer 1').to.emit(likidaMarket, "OfferAccepted");

    offerAccepted = await likidaMarket.getOffer(1);
    let offerOwner = (offerAccepted.owner).toString();

    let after = await provider.getBalance(owner.address);
    after = ethers.utils.formatEther(after.toString());

    balance1155after = await _1155.balanceOf(u2.address,1);

    expect(offerOwner,'Owner in marketplace check').to.equal(u2.address);
    // expect(parseInt(before) + parseInt(totalPrice),'Owners balance check').to.equal(parseInt(after));
    expect(balance1155 + offerAmount,'NFT 1155 u2 check').to.equal(balance1155after);
  });

  it("Owner makes an offer for 0", async function(){
    const precio = 5;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }
    await expect(likidaMarket.connect(owner).makeOffer(0,val),'Owner offers for 0').not.to.be.reverted;
  });

  it("U1 get the offer and owner accept offer 0 to U1", async function(){
    const val = {
      value: ethers.utils.parseEther("5")
    }
    await expect(likidaMarket.connect(u1).makeOffer(0,val),'U1 get the offer of owner with same price').to.emit(likidaMarket, "OfferMade");

    // Balance MATIC
    let balance = await provider.getBalance(owner.address);
    let before = ethers.utils.formatEther(balance.toString());

    // Balance 721 u1
    let balance721 = await _721.balanceOf(u1.address);

    let offerAccepted = await likidaMarket.getOffer(0);
    let offerPrice = ethers.utils.formatEther((offerAccepted.price).toString());

    await expect(likidaMarket.connect(owner).acceptOffer(0, "0x00"),'Owner accept offer 1').to.emit(likidaMarket, "OfferAccepted");

    offerAccepted = await likidaMarket.getOffer(0);
    let offerOwner = (offerAccepted.owner).toString();

    let after = await provider.getBalance(owner.address);
    after = ethers.utils.formatEther(after.toString());

    balance721after = await _721.balanceOf(u1.address);

    expect(offerOwner,'Owner in marketplace check').to.equal(u1.address);
    expect(parseInt(before) + parseInt(offerPrice),'Owners balance check').to.equal(parseInt(after));
    expect(balance721 + 1,'NFT 721 u1 check').to.equal(balance721after);
  });

  it("U1 put in sale (not bidding) his 721 recently buyed", async function(){

    const precio = 2;
    const price = ethers.utils.parseEther(precio.toString());

    const balance721marketbefore = await _721.balanceOf(likidaMarket.address);
    
    await expect(_721.connect(u1).approve(likidaMarket.address, 2),'Approve').not.to.be.reverted;
    await expect(likidaMarket.connect(u1).putOnSale(2, _721.address, price, 0, "0x00"),'PutOnSale 721').to.emit(likidaMarket, "OfferAdded");
    
    const balance721marketafter = await _721.balanceOf(likidaMarket.address);

    expect(parseInt(balance721marketbefore) + 1, 'New 721 balance of marketplace').to.equal(parseInt(balance721marketafter));
    expect(await _721.ownerOf(2),'Owner of NFT').to.equal(likidaMarket.address);
  });

  it("U2 buy 721's U1 recently put in sale", async function(){
    const precio = 2;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }

    const balanceBuyer = await provider.getBalance(u2.address);
    const balanceBefore = ethers.utils.formatEther(balanceBuyer.toString());

    const balanceSeller = await provider.getBalance(u1.address);
    const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());

    const balance721before = await _721.balanceOf(u2.address);
    
    await expect(likidaMarket.connect(u2).buyOffer(2, "0x00", val),'Buy 721').to.emit(likidaMarket, "OfferSold");
    
    const balanceBuyerAfter = await provider.getBalance(u2.address);
    const balanceAfter = ethers.utils.formatEther(balanceBuyerAfter.toString());

    const balanceSellerAfter = await provider.getBalance(u1.address);
    const balanceAfterS = ethers.utils.formatEther(balanceSellerAfter.toString());

    const balance721after = await _721.balanceOf(u2.address);

    expect(parseInt(balanceBeforeS) + precio,'New balance of u1 wallet').to.equal(parseInt(balanceAfterS));
    expect(parseInt(balanceBefore) - precio, 'New balance of u2 wallet').to.equal(parseInt(balanceAfter));
    expect(parseInt(balance721before) + 1, 'New 721 balance of marketplace').to.equal(parseInt(balance721after));
    expect(await _721.ownerOf(2),'Owner of NFT').to.equal(u2.address);
  });

  it("Owner puts on sale 4 1155R", async function(){
    const precio = 20;
    const price = ethers.utils.parseEther(precio.toString());
    const amount = 4;

    const balance1155RMarketBefore = await _1155R.balanceOf(likidaMarket.address, 1);

    await expect(_1155R.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
    await expect(likidaMarket.connect(owner).putOnSale(1, _1155R.address, price, amount, "0x00"),'PutOnSale 1155R').to.emit(likidaMarket, "OfferAdded");
    
    const balance1155RMarketAfter = await _1155R.balanceOf(likidaMarket.address, 1);

    expect(parseInt(balance1155RMarketBefore) + amount, 'New 1155R balance of marketplace').to.equal(parseInt(balance1155RMarketAfter));
  });

  it("U1 buy 1155R's owner recently put in sale", async function(){
    const balance1155RBefore= await _1155R.balanceOf(u1.address, 1);

    let balanceBuyer = await provider.getBalance(u1.address);
    const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());

    let balanceSeller = await provider.getBalance(owner.address);
    const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
    
    let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
    const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
    
    let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
    const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());

    const offer = await likidaMarket.getOffer(3);
    const amountOf = parseInt(offer.token.amount);

    const precio = 20 * amountOf;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }

    await expect(likidaMarket.connect(u1).buyOffer(3, "0x00", val),'Buy 1155R').to.emit(likidaMarket, "OfferSold");
    
    const balance1155RAfter = await _1155R.balanceOf(u1.address, 1);

    balanceBuyer = await provider.getBalance(u1.address);
    const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());

    balanceSeller = await provider.getBalance(owner.address);
    const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
    
    feeReceiverBalance = await provider.getBalance(feeReceiver.address);
    const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
    
    royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
    const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());

    const FR = precio * (fee / 100);
    const RR = precio * (fee / 100);
    const sellerTotal  = precio - FR - RR;

    // Seller
    expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));

    // Likida
    expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));

    // Royalties
    expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));

    // Buyer
    expect(parseInt(balanceBeforeB) - precio, 'New balance of u1 wallet').to.equal(parseInt(balanceAfterB));

    // Balance
    expect(parseInt(balance1155RBefore) + amountOf, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
  });

  it("Owner puts on sale 10 1155R", async function(){
    const precio = 20;
    const price = ethers.utils.parseEther(precio.toString());
    const amount = 10;

    const balance1155RMarketBefore = await _1155R.balanceOf(likidaMarket.address, 1);

    await expect(_1155R.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
    await expect(likidaMarket.connect(owner).putOnSale(1, _1155R.address, price, amount, "0x00"),'PutOnSale 1155R').to.emit(likidaMarket, "OfferAdded");
    
    const balance1155RMarketAfter = await _1155R.balanceOf(likidaMarket.address, 1);

    expect(parseInt(balance1155RMarketBefore) + amount, 'New 1155R balance of marketplace').to.equal(parseInt(balance1155RMarketAfter));
  });

  it("U1 buy 5 1155R's owner recently put in sale", async function(){
    const balance1155RBefore= await _1155R.balanceOf(u1.address, 1);

    let balanceBuyer = await provider.getBalance(u1.address);
    const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());

    let balanceSeller = await provider.getBalance(owner.address);
    const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
    
    let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
    const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
    
    let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
    const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());

    let offer = await likidaMarket.getOffer(4);
    const amountBefore = parseInt(offer.token.amount);

    const amountOf = 5
    const precio = 20 * amountOf;
    const val = {
      value : ethers.utils.parseEther(precio.toString())
    }

    await expect(likidaMarket.connect(u1).buyByAmount(4, amountOf, "0x00", val),'Buy 1155R INDIVIDUAL').to.emit(likidaMarket, "IndividualSold");
    
    offer = await likidaMarket.getOffer(4);
    const amountAfter = parseInt(offer.token.amount);

    const balance1155RAfter = await _1155R.balanceOf(u1.address, 1);

    balanceBuyer = await provider.getBalance(u1.address);
    const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());

    balanceSeller = await provider.getBalance(owner.address);
    const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
    
    feeReceiverBalance = await provider.getBalance(feeReceiver.address);
    const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
    
    royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
    const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());

    const FR = precio * (fee / 100);
    const RR = precio * (fee / 100);
    const sellerTotal  = precio - FR - RR;

    //Amount
    expect(amountBefore - amountOf, 'New amount').to.equal(amountAfter);
    
    // Seller
    expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));

    // Likida
    expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));

    // Royalties
    expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));

    // Buyer
    expect(parseInt(balanceBeforeB) - precio, 'New balance of u1 wallet').to.equal(parseInt(balanceAfterB));

    // Balance
    expect(parseInt(balance1155RBefore) + amountOf, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
  });
});

/*
  U1 = Owner
  U2 = U1
  U3 = U2
  -> Offer 4
*/
describe("Test suite Notion", function(){
  describe("1", function(){
    it("U1 sells a 721 w/r with fixed price : 20 $MATIC", async function(){
      const price = ethers.utils.parseEther("20");
      const id = 1;
  
      // Approve
      await expect(_721R.connect(owner).approve(likidaMarket.address, id),'Approve').not.to.be.reverted;
  
      //! OFFER 5
      await expect(likidaMarket.connect(owner).putOnSale(id, _721R.address, price, 0, "0x00"),'PutOnSale 721R').to.emit(likidaMarket, "OfferAdded");
  
      //* Success criteria 
      expect(await _721R.ownerOf(id),'Check: 721R in marketplace').to.equal(likidaMarket.address);
    });
  
    it("U2 buys U1's 721 w/r: Marketplace pays to U1 total - Likidafees - Royalties fees", async function(){
      const id = 5;
      
      // Before
      const balance721RBefore= await _721R.balanceOf(u1.address);
  
      let balanceBuyer = await provider.getBalance(u1.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
  
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const ownerBefore = offer.owner;
  
      // Buy op
      const precio = 20;
      const val = {
        value : ethers.utils.parseEther(precio.toString())
      }
  
      await expect(likidaMarket.connect(u1).buyOffer(id, "0x00", val),'Buy 721R').to.emit(likidaMarket, "OfferSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const ownerAfter = offer.owner;
  
      const balance721RAfter = await _721R.balanceOf(u1.address);
  
      balanceBuyer = await provider.getBalance(u1.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
  
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      // Money distribution
      const FR = precio * (fee / 100);
      const RR = precio * (fee / 100);
      const sellerTotal  = precio - FR - RR;
  
      //* Success Criteria
      //* Owner
      expect(ownerBefore, 'Old owner').to.equal(ethers.constants.AddressZero);
      expect(ownerAfter, 'New owner').to.equal(u1.address);
      
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - precio, 'New balance of u1 wallet').to.equal(parseInt(balanceAfterB));
  
      //* Balance
      expect(parseInt(balance721RBefore) + 1, 'New 721R balance of buyer').to.equal(parseInt(balance721RAfter));
    });
  
    it("U1 sells a 721 with fixed price : 20 $MATIC", async function(){
      const price = ethers.utils.parseEther("20");
      const id = 5;
  
      // Approve
      await expect(_721.connect(owner).approve(likidaMarket.address, id),'Approve').not.to.be.reverted;
  
      //! OFFER 6
      await expect(likidaMarket.connect(owner).putOnSale(id, _721.address, price, 0, "0x00"),'PutOnSale 721').to.emit(likidaMarket, "OfferAdded");
  
      //* Success criteria 
      expect(await _721.ownerOf(id),'Check: 721 in marketplace').to.equal(likidaMarket.address);
    });
  
    it("U2 buys U1's 721: Marketplace pays to U1 total - Likidafees", async function(){
      const id = 6;
      
      // Before
      const balance721Before= await _721.balanceOf(u1.address);
  
      let balanceBuyer = await provider.getBalance(u1.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
  
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const ownerBefore = offer.owner;
  
      // Buy op
      const precio = 20;
      const val = {
        value : ethers.utils.parseEther(precio.toString())
      }
  
      await expect(likidaMarket.connect(u1).buyOffer(id, "0x00", val),'Buy 721').to.emit(likidaMarket, "OfferSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const ownerAfter = offer.owner;
  
      const balance721After = await _721.balanceOf(u1.address);
  
      balanceBuyer = await provider.getBalance(u1.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
  
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      // Money distribution
      const FR = precio * (fee / 100);
      const sellerTotal  = precio - FR;
  
      //* Success Criteria
      //* Owner
      expect(ownerBefore, 'Old owner').to.equal(ethers.constants.AddressZero);
      expect(ownerAfter, 'New owner').to.equal(u1.address);
      
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties (no changes)
      expect(parseInt(balanceBeforeRR), 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - precio, 'New balance of u1 wallet').to.equal(parseInt(balanceAfterB));
  
      //* Balance
      expect(parseInt(balance721Before) + 1, 'New 721 balance of buyer').to.equal(parseInt(balance721After));
    });
  
    it("U1 sells 40 1155 w/r with fixed price : 1$ MATIC", async function(){
      const precio = 1;
      const price = ethers.utils.parseEther(precio.toString());
      const id = 1;
      const amount = 40;
  
      const balance1155RMarketBefore = await _1155R.balanceOf(likidaMarket.address, id);
  
      //! BUSCAR ALTERNATIVA
      await expect(_1155R.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
  
      //! OFFER 7
      await expect(likidaMarket.connect(owner).putOnSale(id, _1155R.address, price, amount, "0x00"),'PutOnSale 1155R').to.emit(likidaMarket, "OfferAdded");
      
      const balance1155RMarketAfter = await _1155R.balanceOf(likidaMarket.address, id);
  
      //* Sucess criteria
      expect(parseInt(balance1155RMarketBefore) + amount, 'New 1155R balance of marketplace').to.equal(parseInt(balance1155RMarketAfter));
    });
  
    it("U2 buys U1's 20 1155: Marketplace pays to U1 total * 20 - Likida Fees - Royalties fees", async function(){
      const id = 7;
      const id1155 = 1;
      const buyer = u1;
      
      // Before
      const balance1155RBefore= await _1155R.balanceOf(buyer.address, id1155);
  
      let balanceBuyer = await provider.getBalance(buyer.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
  
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const amountBefore = offer.token.amount;
  
      // Buy op
      const amount = 20;
      const precio = 1;
      const total = precio * amount;
      const val = {
        value : ethers.utils.parseEther(total.toString())
      }
  
      await expect(likidaMarket.connect(buyer).buyByAmount(id, amount, "0x00", val),'Buy 1155R').to.emit(likidaMarket, "IndividualSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const amountAfter = offer.token.amount;
  
      const balance1155RAfter = await _1155R.balanceOf(buyer.address, id1155);
  
      balanceBuyer = await provider.getBalance(buyer.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
  
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      // Money distribution
      const FR = total * (fee / 100);
      const RR = total * (fee / 100);
      const sellerTotal  = total - FR - RR;
  
      //* Success Criteria
  
      //* Amount left in Marketplace
      expect(parseInt(amountBefore) - amount,'New amount updated').to.equal(parseInt(amountAfter));
  
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - total, 'New balance of u1 wallet').to.equal(parseInt(balanceAfterB));
  
      // //* Balance
      expect(parseInt(balance1155RBefore) + amount, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
    });
  
    it("U3 buys the rest of 1155: Marketplace pays to U1 total * 20 - Likida Fees - Royalties fees", async function(){
      const id = 7;
      const id1155 = 1;
      const buyer = u2;
      
      // Before
      const balance1155RBefore= await _1155R.balanceOf(buyer.address, id1155);
      
      let balanceBuyer = await provider.getBalance(buyer.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
      
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const amountBefore = offer.token.amount;
  
      // Buy op
      const amount = 20;
      const precio = 1;
      const total = precio * amount;
      const val = {
        value : ethers.utils.parseEther(total.toString())
      }
  
      await expect(likidaMarket.connect(buyer).buyOffer(id, "0x00", val),'Buy 1155R').to.emit(likidaMarket, "OfferSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const amountAfter = offer.token.amount;
      
      const balance1155RAfter = await _1155R.balanceOf(buyer.address, id1155);
      
      balanceBuyer = await provider.getBalance(buyer.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
      
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
      
      // Money distribution
      const FR = total * (fee / 100);
      const RR = total * (fee / 100);
      const sellerTotal  = total - FR - RR;
  
      //* Success Criteria
  
      //* Amount left in Marketplace
      expect(parseInt(amountBefore) - amount,'New amount updated').to.equal(parseInt(amountAfter));
  
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - total, 'New balance of u2 wallet').to.equal(parseInt(balanceAfterB));
  
      // //* Balance
      expect(parseInt(balance1155RBefore) + amount, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
    });
  
    it("U1 sells 40 1155 with fixed price : 1 $MATIC", async function(){
      const precio = 1;
      const price = ethers.utils.parseEther(precio.toString());
      const amount = 40;
      const id = 1;
  
      const balance1155MarketBefore = await _1155.balanceOf(likidaMarket.address, id);
  
      //! BUSCAR ALTERNATIVA
      await expect(_1155.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
  
      //! OFFER 8
      await expect(likidaMarket.connect(owner).putOnSale(id, _1155.address, price, amount, "0x00"),'PutOnSale 1155').to.emit(likidaMarket, "OfferAdded");
      
      const balance1155MarketAfter = await _1155.balanceOf(likidaMarket.address, id);
  
      //* Success Criteria
      expect(parseInt(balance1155MarketBefore) + amount, 'New 1155 balance of marketplace').to.equal(parseInt(balance1155MarketAfter));
    });
  
    it("U2 buys U1's 20 1155: Marketplace pays to U1 total * 20 - Likida Fees", async function(){
      const id = 8;
      const id1155 = 1;
      const buyer = u1;
      
      // Before
      const balance1155RBefore= await _1155.balanceOf(buyer.address, id1155);
      
      let balanceBuyer = await provider.getBalance(buyer.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
      
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const amountBefore = offer.token.amount;
  
      // Buy op
      const amount = 20;
      const precio = 1;
      const total = precio * amount;
      const val = {
        value : ethers.utils.parseEther(total.toString())
      }
  
      await expect(likidaMarket.connect(buyer).buyByAmount(id, amount, "0x00", val),'Buy 1155R').to.emit(likidaMarket, "IndividualSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const amountAfter = offer.token.amount;
      
      const balance1155RAfter = await _1155.balanceOf(buyer.address, id1155);
      
      balanceBuyer = await provider.getBalance(buyer.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
      
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
      
      // Money distribution
      const FR = total * (fee / 100);
      const sellerTotal  = total - FR;
  
      //* Success Criteria
  
      //* Amount left in Marketplace
      expect(parseInt(amountBefore) - amount,'New amount updated').to.equal(parseInt(amountAfter));
  
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR), 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - total, 'New balance of u2 wallet').to.equal(parseInt(balanceAfterB));
  
      // //* Balance
      expect(parseInt(balance1155RBefore) + amount, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
  
    });
  
    it("U3 buys the rest of 1155: Marketplace pays to U1 total * 20 - Likida Fees", async function(){
      const id = 8;
      const id1155 = 1;
      const buyer = u2;
      
      // Before
      const balance1155RBefore= await _1155.balanceOf(buyer.address, id1155);
      
      let balanceBuyer = await provider.getBalance(buyer.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
      
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const amountBefore = offer.token.amount;
  
      // Buy op
      const amount = 20;
      const precio = 1;
      const total = precio * amount;
      const val = {
        value : ethers.utils.parseEther(total.toString())
      }
  
      await expect(likidaMarket.connect(buyer).buyOffer(id, "0x00", val),'Buy 1155R').to.emit(likidaMarket, "OfferSold");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const amountAfter = offer.token.amount;
      
      const balance1155RAfter = await _1155.balanceOf(buyer.address, id1155);
      
      balanceBuyer = await provider.getBalance(buyer.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
      
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
      
      // Money distribution
      const FR = total * (fee / 100);
      const sellerTotal  = total - FR;
  
      //* Success Criteria
  
      //* Amount left in Marketplace
      expect(parseInt(amountBefore) - amount,'New amount updated').to.equal(parseInt(amountAfter));
  
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR), 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB) - total, 'New balance of u2 wallet').to.equal(parseInt(balanceAfterB));
  
      // //* Balance
      expect(parseInt(balance1155RBefore) + amount, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
    });
  });

  describe("2", function(){
    it("U1 sells a 721R open for bidding : 1 $MATIC", async function(){
      const id = 10;
      await expect(_721R.connect(owner).approve(likidaMarket.address, id),'Approve').not.to.be.reverted;
      //! OFFER 9
      await expect(likidaMarket.connect(owner).putOnSale(id, _721R.address, 0, 0, "0x00"),'PutOnSale 721R in bidding').to.emit(likidaMarket, "OfferAdded");
      expect(await _721R.ownerOf(id),'Check: 721R in marketplace').to.equal(likidaMarket.address);
    });

    it("U2 makes an offer 1 $MATIC", async function() {
      const offerId = 9;
      const price = 1;
      const bidder = u1;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      const val = { 
        value : ethers.utils.parseEther(price.toString()) 
      }
      await expect(likidaMarket.connect(bidder).makeOffer(offerId, val),'Make an offer of 1 $MATIC').to.emit(likidaMarket, "OfferMade");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));
      
      expect(balanceBefore - price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U1 denies offer and U2 recover the price", async function(){
      const offerId = 9;
      const price = 1;
      const bidder = u1;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      await expect(likidaMarket.connect(owner).cancelOffer(offerId), 'Cancel offer by owner').to.emit(likidaMarket, "OfferCanceled");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));

      expect(balanceBefore + price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U3 makes an offer 20 $MATIC", async function(){
      const offerId = 9;
      const price = 20;
      const bidder = u2;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      const val = { 
        value : ethers.utils.parseEther(price.toString()) 
      }
      await expect(likidaMarket.connect(bidder).makeOffer(offerId, val),'Make an offer of 20 $MATIC').to.emit(likidaMarket, "OfferMade");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));
      
      expect(balanceBefore - price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U1 accept offer by U3", async function(){
      const id = 9;
      const bidder = u2;
      
      // Before
      const balance721RBefore= await _721R.balanceOf(bidder.address);
  
      let balanceBuyer = await provider.getBalance(bidder.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
  
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(id);
      const ownerBefore = offer.owner;
      const tokenId = offer.token.tokenId;

      // Buy op
      const precio = 20;

      await expect(likidaMarket.connect(owner).acceptOffer(id, "0x00"),'Buy 721R').to.emit(likidaMarket, "OfferAccepted");
      
      // After
      offer = await likidaMarket.getOffer(id);
      const ownerAfter = offer.owner;
  
      const balance721RAfter = await _721R.balanceOf(bidder.address);
  
      balanceBuyer = await provider.getBalance(bidder.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
  
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      // Money distribution
      const FR = precio * (fee / 100);
      const RR = precio * (fee / 100);
      const sellerTotal  = precio - FR - RR;
  
      //* Success Criteria
      //* Owner
      expect(ownerBefore, 'Old owner').to.equal(ethers.constants.AddressZero);
      expect(ownerAfter, 'New owner').to.equal(bidder.address);
      expect(await _721R.ownerOf(tokenId), 'New owner').to.equal(bidder.address);
      
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB), 'New balance of u3 wallet').to.equal(parseInt(balanceAfterB));
  
      //* Balance
      expect(parseInt(balance721RBefore) + 1, 'New 721R balance of buyer').to.equal(parseInt(balance721RAfter));
    });

    it("U1 sells a 20 1155R-1 for bidding : 1 $MATIC", async function(){
      const id = 1;
      const amount = 20;
      const balanceBefore = await _1155R.balanceOf(likidaMarket.address, id);
      //! OFFER 10
      await expect(_1155R.connect(owner).setApprovalForAll(likidaMarket.address, true),'Approve').not.to.be.reverted;
      await expect(likidaMarket.connect(owner).putOnSale(id, _1155R.address, 0, amount, "0x00"),'PutOnSale 1155R').to.emit(likidaMarket, "OfferAdded");
      expect(parseInt(balanceBefore) + amount,'Check: 1155R in marketplace').to.equal(await _1155R.balanceOf(likidaMarket.address, id));
    });

    it("U2 makes an offer of 1 $MATIC", async function(){
      const offerId = 10;
      const price = 1;
      const bidder = u1;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      const val = { 
        value : ethers.utils.parseEther(price.toString()) 
      }
      await expect(likidaMarket.connect(bidder).makeOffer(offerId, val),'Make an offer of 1 $MATIC').to.emit(likidaMarket, "OfferMade");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));
      
      expect(balanceBefore - price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U1 denies offer of U2 recover the price", async function(){
      const offerId = 10;
      const price = 1;
      const bidder = u1;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      await expect(likidaMarket.connect(owner).cancelOffer(offerId), 'Cancel offer by owner').to.emit(likidaMarket, "OfferCanceled");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));

      expect(balanceBefore + price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U3 makes an offer 1 $MATIC", async function(){
      const offerId = 10;
      const amount = 20;
      const price = 1 * amount;
      const bidder = u2;

      let gb = await provider.getBalance(bidder.address);
      const balanceBefore = parseInt(ethers.utils.formatEther(gb.toString()));

      const val = { 
        value : ethers.utils.parseEther(price.toString()) 
      }
      await expect(likidaMarket.connect(bidder).makeOffer(offerId, val),'Make an offer of 1 $MATIC').to.emit(likidaMarket, "OfferMade");

      gb = await provider.getBalance(bidder.address);
      const balanceAfter = parseInt(ethers.utils.formatEther(gb.toString()));
      
      expect(balanceBefore - price, 'New balance of bidder').to.equal(balanceAfter);
    });

    it("U1 accept U3's offer", async function(){
      const id = 1;
      const offerId = 10;
      const bidder = u2;
      
      // Before
      const balance1155RBefore= await _1155R.balanceOf(bidder.address, id);
  
      let balanceBuyer = await provider.getBalance(bidder.address);
      const balanceBeforeB = ethers.utils.formatEther(balanceBuyer.toString());
  
      let balanceSeller = await provider.getBalance(owner.address);
      const balanceBeforeS = ethers.utils.formatEther(balanceSeller.toString());
      
      let feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceBeforeFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      let royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceBeforeRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      let offer = await likidaMarket.getOffer(offerId);
      const ownerBefore = offer.owner;

      // Buy op
      const precio = 1;
      const amount = 20;
      const total = amount * precio;

      await expect(likidaMarket.connect(owner).acceptOffer(offerId, "0x00"),'Buy 1155R').to.emit(likidaMarket, "OfferAccepted");
      
      // After
      offer = await likidaMarket.getOffer(offerId);
      const ownerAfter = offer.owner;
  
      const balance1155RAfter = await _1155R.balanceOf(bidder.address, id);
  
      balanceBuyer = await provider.getBalance(bidder.address);
      const balanceAfterB = ethers.utils.formatEther(balanceBuyer.toString());
  
      balanceSeller = await provider.getBalance(owner.address);
      const balanceAfterS = ethers.utils.formatEther(balanceSeller.toString());
      
      feeReceiverBalance = await provider.getBalance(feeReceiver.address);
      const balanceAfterFR = ethers.utils.formatEther(feeReceiverBalance.toString());
      
      royaltiesReceiverBalance = await provider.getBalance(royaltiesReceiver.address);
      const balanceAfterRR = ethers.utils.formatEther(royaltiesReceiverBalance.toString());
  
      // Money distribution
      const FR = total * (fee / 100);
      const RR = total * (fee / 100);
      const sellerTotal  = total - FR - RR;
  
      //* Success Criteria
      //* Owner
      expect(ownerBefore, 'Old owner').to.equal(ethers.constants.AddressZero);
      expect(ownerAfter, 'New owner').to.equal(bidder.address);
      
      //* Seller
      expect(parseInt(balanceBeforeS) + sellerTotal, 'New balance of owner wallet').to.equal(parseInt(balanceAfterS));
  
      //* Likida
      expect(parseInt(balanceBeforeFR) + FR, 'New balance of feeReceiver wallet').to.equal(parseInt(balanceAfterFR));
  
      //* Royalties
      expect(parseInt(balanceBeforeRR) + RR, 'New balance of royaltiesReceiver wallet').to.equal(parseInt(balanceAfterRR));
  
      //* Buyer
      expect(parseInt(balanceBeforeB), 'New balance of u3 wallet').to.equal(parseInt(balanceAfterB));
  
      //* Balance
      expect(parseInt(balance1155RBefore) + amount, 'New 1155R balance of buyer').to.equal(parseInt(balance1155RAfter));
    });
  });
});