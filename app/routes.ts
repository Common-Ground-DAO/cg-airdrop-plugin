import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("api/sign", "routes/api.sign.tsx"),
    route("api/airdrops", "routes/api.airdrops.tsx"),
] satisfies RouteConfig;
