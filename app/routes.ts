import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        index("routes/home.tsx"),
        route("airdrops/:airdropId?", "routes/airdrops.tsx"),
        route("airdrops/create", "routes/airdrops.create.tsx"),
        route("vestings/:vestingId?", "routes/vestings.tsx"),
        route("vestings/create", "routes/vestings.create.tsx"),
    ]),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrop/create", "routes/api.airdrop.create.tsx"),
    route("api/airdrop/list", "routes/api.airdrop.list.tsx"),
    route("api/airdrop/details", "routes/api.airdrop.details.tsx"),
    route("api/airdrop/delete", "routes/api.airdrop.delete.tsx"),
    route("api/vesting/create", "routes/api.vesting.create.tsx"),
    route("api/vesting/list", "routes/api.vesting.list.tsx"),
    route("api/vesting/delete", "routes/api.vesting.delete.tsx"),
    route("api/verify-contract", "routes/api.verify-contract.tsx"),
] satisfies RouteConfig;
