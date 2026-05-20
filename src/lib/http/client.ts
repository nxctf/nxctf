import ky from 'ky'

export const httpClient = ky.create({
  prefixUrl: '/api',
  timeout: 15_000,
  retry: {
    limit: 1,
    methods: ['get', 'post', 'put', 'patch', 'delete'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

