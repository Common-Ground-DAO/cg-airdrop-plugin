export async function useAirdropClaimFactory () {
    const { AirdropClaim__factory } = await import("../contracts/factories/contracts/AirdropClaim__factory");
    return AirdropClaim__factory;
}

export async function useCgPluginLib () {
    const { CgPluginLib } = await import("@common-ground-dao/cg-plugin-lib");
    return CgPluginLib.getInstance();
}