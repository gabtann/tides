import { httpTidesApi } from './httpTidesApi'
import { createMockTidesApi } from './mockTidesApi'
import type { TidesApi } from './tidesApi'

export const api: TidesApi = import.meta.env.VITE_USE_MOCK === 'false' ? httpTidesApi : createMockTidesApi()
