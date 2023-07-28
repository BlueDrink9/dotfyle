import { createContext } from '$lib/trpc/context';
import { router, type Router } from '$lib/trpc/router';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { TRPCError, inferRouterContext, ProcedureType } from '@trpc/server';
import { createTRPCHandle } from 'trpc-sveltekit';

import newrelic from 'newrelic';

export const onError = (opts: {
	ctx?: inferRouterContext<Router>;
	error: TRPCError;
	path: string;
	input: unknown;
	req: RequestInit;
	type: ProcedureType | 'unknown';
}) => {
	const { error } = opts;
	if (error.code === 'INTERNAL_SERVER_ERROR') {
		console.log(error);
		error.message = 'Something went wrong';
	}
	delete error.stack;
};


export const profilePerformance: Handle = async ({ event, resolve }) => {
  const route = event.url.pathname

  const start = performance.now()
  const response = await resolve(event)
  const end = performance.now()

  const responseTime = end - start

  if (responseTime >= 1000) {
    console.log(`🐢 ${route} took ${responseTime.toFixed(2)} ms`)
  }

  if (responseTime < 1000) {
    console.log(`🚀 ${route} took ${responseTime.toFixed(2)} ms`)
  }

  return response
}

const handleTrpc = createTRPCHandle({
	router,
	createContext,
	onError
}) satisfies Handle

export const handle = sequence(profilePerformance, handleTrpc);
