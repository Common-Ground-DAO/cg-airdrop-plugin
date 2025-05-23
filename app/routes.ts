import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        index("routes/_index.tsx"),
        route("create", "routes/create.tsx"),
    ]),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrop/create", "routes/api.airdrop.create.tsx"),
    route("api/airdrop/list/:communityId", "routes/api.airdrop.list.tsx"),
    route("api/airdrop/items/:airdropId", "routes/api.airdrop.items.tsx"),
] satisfies RouteConfig;
