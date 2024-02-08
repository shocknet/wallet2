import { Event } from './event';

// Define a type for filter keys
type FilterKey = keyof Filter<number>;

// Define the filter type
export type Filter<K extends number = number> = {
    ids?: string[];
    kinds?: K[];
    authors?: string[];
    since?: number;
    until?: number;
    limit?: number;
    search?: string;
    [key: `#${string}`]: string[] | any;
};

// Function to check if a filter matches an event
export function matchFilter(filter: Filter<number>, event: Event<number>): boolean {
    if (filter.ids && !filter.ids.includes(event.id)) return false;
    if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
    if (filter.authors && !filter.authors.includes(event.pubkey)) return false;

    for (const key in filter) {
        if (key.startsWith('#')) {
            const values = filter[key as `#${string}`];
            if (values && !event.tags.some(([tag, value]) => tag === key.slice(1) && values.includes(value))) {
                return false;
            }
        }
    }

    if (filter.since !== undefined && event.created_at < filter.since) return false;
    if (filter.until !== undefined && event.created_at > filter.until) return false;

    return true;
}

// Function to check if any filter in a list matches an event
export function matchFilters(filters: Filter<number>[], event: Event<number>): boolean {
    return filters.some(filter => matchFilter(filter, event));
}

// Function to merge multiple filters into one
export function mergeFilters(...filters: Filter<number>[]): Filter<number> {
    const result: Filter<number> = {};

    filters.forEach(filter => {
        Object.entries(filter).forEach(([property, values]) => {
            if (property === 'kinds' || property === 'ids' || property === 'authors' || property[0] === '#') {
                if (Array.isArray(values)) {
                    result[property as FilterKey] = [...new Set([...(result[property as FilterKey] || []), ...values])];
                }
            }
        });

        if (filter.limit !== undefined && (result.limit === undefined || filter.limit > result.limit)) {
            result.limit = filter.limit;
        }
        if (filter.until !== undefined && (result.until === undefined || filter.until > result.until)) {
            result.until = filter.until;
        }
        if (filter.since !== undefined && (result.since === undefined || filter.since < result.since)) {
            result.since = filter.since;
        }
    });

    return result;
}
