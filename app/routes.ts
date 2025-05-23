import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        index("routes/_index.tsx"),
        route("create", "routes/create.tsx"),
    ]),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrops", "routes/api.airdrops.tsx"),
] satisfies RouteConfig;
