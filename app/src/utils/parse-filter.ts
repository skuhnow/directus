import { useUserStore } from '@/stores';
import { Accountability } from '@skuhnow/directus-shared/types';
import { parseFilter as parseFilterShared } from '@skuhnow/directus-shared/utils';
import { Filter } from '@skuhnow/directus-shared/types';

export function parseFilter(filter: Filter | null): Filter {
	const userStore = useUserStore();

	if (!userStore.currentUser) return filter ?? {};

	const accountability: Accountability = {
		role: userStore.currentUser.role.id,
		user: userStore.currentUser.id,
	};

	return parseFilterShared(filter, accountability) ?? {};
}
