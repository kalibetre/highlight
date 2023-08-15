import {
	BODY_KEY,
	buildLogsQueryForServer,
	parseLogsQuery,
	quoteQueryValue,
	stringifyLogsQuery,
	validateLogsQuery,
} from './utils'

const complexQueryString = `name:"Eric Thomas" workspace:'Chilly McWilly' project_id:9 freetext query`
const complexQueryParams = [
	{
		key: 'name',
		operator: '=',
		value: '"Eric Thomas"',
		offsetStart: 0,
	},
	{
		key: 'workspace',
		operator: '=',
		value: "'Chilly McWilly'",
		offsetStart: 19,
	},
	{
		key: 'project_id',
		operator: '=',
		value: '9',
		offsetStart: 46,
	},
	{
		key: BODY_KEY,
		operator: '=',
		value: 'freetext query',
		offsetStart: 59,
	},
]

describe('parseLogsQuery', () => {
	it('parses a simple query correctly', () => {
		const query = 'a test query'

		expect(parseLogsQuery(query)).toEqual([
			{
				key: BODY_KEY,
				operator: '=',
				value: query,
				offsetStart: 0,
			},
		])
	})

	it('parses a complex query correctly', () => {
		expect(parseLogsQuery(complexQueryString)).toEqual(complexQueryParams)
	})

	it('calculates offsets correctly when text query when not at end of query', () => {
		const query = 'project_id:18 search query name:"Eric Thomas"'

		expect(parseLogsQuery(query)).toEqual([
			{
				key: 'project_id',
				operator: '=',
				value: '18',
				offsetStart: 0,
			},
			{
				key: BODY_KEY,
				operator: '=',
				value: 'search query',
				offsetStart: 14,
			},
			{
				key: 'name',
				operator: '=',
				value: '"Eric Thomas"',
				offsetStart: 27,
			},
		])
	})

	it('adds a text query when there is a trailing space', () => {
		const query = 'name:"Eric Thomas" '
		expect(parseLogsQuery(query)).toEqual([
			{
				key: 'name',
				operator: '=',
				value: '"Eric Thomas"',
				offsetStart: 0,
			},
			{
				key: BODY_KEY,
				operator: '=',
				value: '',
				offsetStart: 19,
			},
		])
	})

	it('handles separators in quotes', () => {
		const query =
			'"Error updating filter group: Filtering out noisy error" user:"Chilly: McWilly"'
		expect(parseLogsQuery(query)).toEqual([
			{
				key: BODY_KEY,
				operator: '=',
				value: '"Error updating filter group: Filtering out noisy error"',
				offsetStart: 0,
			},
			{
				key: 'user',
				offsetStart: 57,
				operator: '=',
				value: '"Chilly: McWilly"',
			},
		])
	})

	it('handles nested quotes', () => {
		const query = `'test: "ing' user:'Chilly "McWilly"'`
		expect(parseLogsQuery(query)).toEqual([
			{
				key: BODY_KEY,
				operator: '=',
				value: `'test: "ing'`,
				offsetStart: 0,
			},
			{
				key: 'user',
				operator: '=',
				value: `'Chilly "McWilly"'`,
				offsetStart: 13,
			},
		])
	})
})

describe('stringifyLogsQuery', () => {
	it('parses simple params to a query string', () => {
		expect(
			stringifyLogsQuery([
				{
					key: BODY_KEY,
					operator: '=',
					value: 'a test query',
					offsetStart: 0,
				},
			]),
		).toEqual('a test query')
	})

	it('parses complex params to a query string', () => {
		expect(stringifyLogsQuery(complexQueryParams)).toEqual(
			complexQueryString,
		)
	})

	it('includes quotes for the body query', () => {
		expect(
			stringifyLogsQuery([
				{
					key: BODY_KEY,
					operator: '=',
					value: '"Error updating filter group: Filtering out noisy error"',
					offsetStart: 0,
				},
			]),
		).toEqual('"Error updating filter group: Filtering out noisy error"')
	})
})

describe('buildLogsQueryForServer', () => {
	it('handles quoted strings correctly', () => {
		expect(
			buildLogsQueryForServer([
				{
					key: BODY_KEY,
					operator: '=',
					value: `"test: \"ing"`,
					offsetStart: 0,
				},
				{
					key: 'user',
					operator: '=',
					value: `'Chilly "McWilly"'`,
					offsetStart: 10,
				},
			]),
		).toEqual(`"test: \"ing" user:"Chilly \"McWilly\""`)
	})
})

describe('validateLogsQuery', () => {
	it('returns true for an invalid query', () => {
		expect(validateLogsQuery(complexQueryParams)).toBeTruthy()
	})

	it('returns false for an invalid query', () => {
		const params = [...complexQueryParams]
		params[0].value = ''
		expect(validateLogsQuery(params)).toBeFalsy()
	})
})

describe('quoteQueryValue', () => {
	it('quotes strings with spaces', () => {
		expect(quoteQueryValue('a test query')).toEqual('"a test query"')
	})

	it('handles double quoted strings', () => {
		expect(quoteQueryValue('"a test query"')).toEqual('"a test query"')
	})

	it('handles single quoted strings', () => {
		expect(quoteQueryValue("'a test query'")).toEqual("'a test query'")
	})

	it('handles numbers', () => {
		expect(quoteQueryValue(1234)).toEqual('1234')
	})
})
