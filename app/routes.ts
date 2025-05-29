import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        route(":airdropId?", "routes/_index.tsx"),
        route("create-airdrop", "routes/create-airdrop.tsx"),
        route("about", "routes/about.tsx"),
    ]),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrop/create", "routes/api.airdrop.create.tsx"),
    route("api/airdrop/list", "routes/api.airdrop.list.tsx"),
    route("api/airdrop/details", "routes/api.airdrop.details.tsx"),
    route("api/airdrop/delete", "routes/api.airdrop.delete.tsx"),
] satisfies RouteConfig;
