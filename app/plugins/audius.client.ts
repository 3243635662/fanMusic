import { sdk } from "@audius/sdk";
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const audius = sdk({
    apiKey: config.public.apiKey as string,
    bearerToken: config.public.apiBearerToken as string,
  });

  return { provide: { audius } };
});
