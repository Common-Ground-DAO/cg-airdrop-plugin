import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        index("routes/home.tsx"),
        route("airdrops/list", "routes/_layout.airdrops.list.tsx"),
        route("airdrops/create", "routes/_layout.airdrops.create.tsx"),
    ]),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrops", "routes/api.airdrops.tsx"),
] satisfies RouteConfig;
