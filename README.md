
# Likida Marketplace v1.0

#### Transfers

- Poner en venta : transfer solo del NFT (1155 con amount)

- Retirar oferta: transfer NFT (1155 amount almacenado) al seller.

- Comprar oferta: transfer del NFT (1155 amount almacenado) al comprador y msg.value al seller. 

	- [ ] Comprar oferta individual (1155): transfer del amount que se recibe por parámetro, resta del amount comprado al almacenado y transfer del 1155 en cantidad al comprador y msg.value al seller.
		- [ ] Transfer fees Likida Multisig 
	 	- [ ] EIP-2981	
	- [ ] Transfer fees Likida Multisig
	- [ ] EIP-2981
	
- Poner oferta en licitación: transfer de la oferta al contrato.
- Cancelar oferta en licitación: transfer de la oferta hecha al bidder.

- Aceptar oferta en licitación: transfer de la oferta del bidder al seller, transfer del NFT al bidder (1155 amount almacenado)
	- [ ] Transfer fees Likida Multisig
	- [ ] EIP-2981 

#### Control de precio

- Poner a la venta: Si es 0, se pone en licitación, sino, venta directa con precio > 0.

- Retirar oferta: OnlySeller: REVERT EN LICITACIÓN; Se envía el NFT de vuelta al propietario y se pone el owner=propietario.

- Comprar oferta individual (1155): REVERT EN LICITACIÓN; Si offerId pertenece a una oferta 1155, si la cantidad almacenada es > 0, se multiplica el amount del parámetro por el precio almacenado y se comprueba si msg.value es == a ese resultado. Se envian las cosas y se pone el owner=comprador.

- Comprar oferta: REVERT EN LICITACIÓN; Si es 1155, el precio a comprobar se multiplica por el amount almacenado. Se envian las cosas y el owner=comprador. 

- Poner oferta en licitación: El precio debe ser >= que el precio actual.

- Cancelar oferta en licitación: Si el precio es 0, pues se transfiere.. nada?

- Aceptar oferta en licitación: Precio controlado que sea > 0.


#### Tests

```
Deploy
    √ Deployed all contracts (0ms)

  721 Dummy
    √ Mint 50 721 to Owner (3048ms)
    √ Transfer to likidaMarket token 1 (121ms)

  1155 Dummy
    √ Mint 100 of 0,1,2 from 1155 to Owner (141ms)
    √ NO BATCH: Transfer 10 of 0,1,2 to LikidaMarket (253ms)
    √ BATCH: Transfer 10 of 0,1,2 to LikidaMarket (282ms)

  Likida Market Test Suite
    √ OFFER 0: Try to putOnSale in bidding one ERC721 token (278ms)
    √ OFFER 1: Try to putOnSale in bidding one ERC1155-1 token (136ms)
    √ Owner checks in bidding offers (40ms)
    √ Should revert when other1 try to buy offer 0 price 0 (100ms)
    √ Should revert when owner try to put a price to an offer NOT IN Bidding (60ms)
    √ Owner should change price to offer 0 (61ms)
    √ Should revert when Other1 try to put an cheaper offer for offer 0 (41ms)
    √ Other1 makes an offer for 0 checking balances of $MATIC (110ms)
    √ REVERTS: Other2 try to cancel offer from Other1 (125ms)
    √ Other1 cancel his offer checking balances of $MATIC (134ms)
    √ Owner cancel his offer checking final price in blockchain (163ms)
    √ Other2 makes an offer for item 1 (84ms)
    √ Owner accept offer 1 for Other2 (193ms)
    √ Owner makes an offer for 0 (57ms)
    √ Other get the offer and owner accept offer 0 to other1 (252ms)
    √ Other1 put in sale (not bidding) his 721 recently buyed (311ms)
    √ Other2 buy 721's other1 recently put in sale (202ms)

·------------------------------------------|---------------------------|-------------|-----------------------------·
|           Solc version: 0.8.13           ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
···········································|···························|·············|······························
|  Methods                                 ·               51 gwei/gas               ·       1.39 usd/matic        │
·················|·························|·············|·············|·············|···············|··············
|  Contract      ·  Method                 ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  acceptOffer            ·     137125  ·     150453  ·     143789  ·            4  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  cancelOfferInBidding   ·      46736  ·      71248  ·      58992  ·            4  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  changeState            ·          -  ·          -  ·      55057  ·            1  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  makeOfferInBidding     ·      37337  ·      57249  ·      47990  ·            8  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  putOnSale              ·     200265  ·     222192  ·     213254  ·            6  ·       0.02  │
·················|·························|·············|·············|·············|···············|··············
|  LikidaMarket  ·  sellOffer              ·          -  ·          -  ·     149584  ·            2  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  My1155        ·  mintBatch              ·          -  ·          -  ·     174337  ·            2  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  My1155        ·  safeBatchTransferFrom  ·          -  ·          -  ·      78628  ·            2  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  My1155        ·  safeTransferFrom       ·      64301  ·      64313  ·      64309  ·            6  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  My1155        ·  setApprovalForAll      ·          -  ·          -  ·      46177  ·            1  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  My721         ·  approve                ·          -  ·          -  ·      48786  ·            2  ·       0.00  │
·················|·························|·············|·············|·············|···············|··············
|  My721         ·  safeMint               ·     126448  ·     154748  ·     154182  ·          100  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  My721         ·  safeTransferFrom       ·          -  ·          -  ·     103775  ·            2  ·       0.01  │
·················|·························|·············|·············|·············|···············|··············
|  Deployments                             ·                                         ·  % of limit   ·             │
···········································|·············|·············|·············|···············|··············
|  LikidaMarket                            ·          -  ·          -  ·    2683606  ·        8.9 %  ·       0.19  │
···········································|·············|·············|·············|···············|··············
|  My1155                                  ·          -  ·          -  ·    1836206  ·        6.1 %  ·       0.13  │
···········································|·············|·············|·············|···············|··············
|  My721                                   ·          -  ·          -  ·    1588081  ·        5.3 %  ·       0.11  │
·------------------------------------------|-------------|-------------|-------------|---------------|-------------·

  23 passing (8s)
```
