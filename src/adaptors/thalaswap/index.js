const utils = require('../utils');

const thalaswapAddress = '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af';
const NODE_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';
const THALA_DAPP_URL = 'http://app.thala.fi';
const THALASWAP_RESOURCE_URL = `${NODE_URL}/accounts/${thalaswapAddress}/resources`;
const THALA_POOL_API_URL = `${THALA_DAPP_URL}/api/liquidity-pool?pool-type=`;
const stablePoolType = `${thalaswapAddress}::stable_pool::StablePool<`
// stable coins used in thalaswap which we are interested in for our stable pairs
const stables = ['0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC', "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD", "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT", "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T"] 
const nullCoinType = "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af::base_pool::Null";

const extractCoinAddress = resource => resource.type.split('<')[1].replace('>', '').split(', ');
const poolsFilter = resource => resource.type.includes(stablePoolType);
const pairsFilter = pool => pool.asset_types.every((coinType) => stables.includes(coinType) || coinType === nullCoinType);

async function main() {
    const thalaswapResources = await utils.getData(THALASWAP_RESOURCE_URL);

    const pools = thalaswapResources.filter(poolsFilter).map(pool => ({
        type: pool.type,
        asset_types: extractCoinAddress(pool),
    }));

    const stablePairs = pools.filter(pairsFilter);

    tvlArr = [];
    stablePairs.forEach(async ({ type, assets, asset_types }, i) => {
        const liquidityPool = (await utils.getData(THALA_POOL_API_URL + type))?.data;

        tvlArr.push({
            pool: stablePoolType + liquidityPool.coins.map(coin => coin.symbol).join('-') + ">",
            chain: utils.formatChain('aptos'),
            project: 'thalaswap',
            apyBase: (liquidityPool.swapFeeApr ?? 0) * 100,
            apyReward: (liquidityPool.farmingApr ?? 0) * 100,
            rewardTokens: ["0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL"],
            symbol: liquidityPool.coins.map(coin => coin.symbol).join('-'),
            tvlUsd: liquidityPool.tvlUsd,
            underlyingTokens: liquidityPool.coinAddresses,
        });
    });
    return tvlArr;
}

module.exports = {
    timetravel: false,
    apy: main,
    url: 'https://app.thala.fi/pools',
};
