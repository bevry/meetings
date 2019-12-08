/* eslint camelcase:0, new-cap:0 */
import fetchJSON from '../shared/fetch'
import {
	RawEventType,
	RawEventsType,
	RichEventType,
	RichEventsType
} from '../shared/types'
import Daet from 'daet'
import { DEVELOPMENT, expiresUnit, expiresValue } from '../shared/config'

function firstLine(str?: string): string {
	return (str || '').split(/\s*(\n|<br>)\s*/)[0]
}

// runs on client+server
// export function fetchRawEventDb(hostname: string) {}
export async function fetchRawEventDb({
	dbname
}: {
	dbname: string
}): Promise<RawEventsType> {
	const faunadb = require('faunadb')
	const q = faunadb.query
	const faunaEnv = JSON.parse(process.env.FAUNADB || '{ }')
	const faunaSecret = faunaEnv.FAUNADB_SECRET_KEY
	const client = new faunadb.Client({ secret: faunaSecret })
	let ids: String[] = []

	/* Get the unique faunadb ID for all events. */
	await client
		.query(q.Paginate(q.Match(q.Index('all_posts'))))
		.then(function(dbentry: any) {
			ids = dbentry.data.map((x: { id: string }) => x.id)
			return ids
		})
		.catch((err: any) => {
			console.warn('FAILED TO FETCH EVENTS FROM FAUNADB:', dbname, err)
			return []
		})

	/* Read the data for the events from faunadb.
	 * TODO: It would be good if it can be done in one step i.e. read the data
	 * for all the events in one go rather than first reading ids and then sending
	 * a query for every id. */
	const rawEvents: RawEventsType = []
	for (const id of ids) {
		console.log('Querying ID: ' + id)
		await client
			.query(q.Get(q.Ref(q.Collection(dbname), id)))
			.then((dbentry: any) => {
				rawEvents.push(dbentry.data)
			})
			.catch((err: any) => {
				console.warn('FAILED TO FETCH EVENTS FROM FAUNADB:', dbname, err)
				return []
			})
	}
	console.log(rawEvents)
	return rawEvents
}

// runs on client+server
// export function fetchRawEvents(hostname: string) {}
export function fetchRawEvents({
	hostname
}: {
	hostname: string
}): Promise<RawEventsType> {
	const url = hostname + '/api/events'
	return fetchJSON(url)
		.then(function(rawEvents: RawEventsType) {
			// if development, convert the events to more recent ones
			if (DEVELOPMENT) {
				// modify the events we receive, to start one minute from now, and expire one minute later
				// so that we can as the developer see the progression between the states quickly
				const now = new Daet()
				rawEvents = rawEvents.map((rawEvent, index) => {
					const minutes = 1 + index
					const start = now.plus(minutes, 'minute').reset('second')
					const end = start.plus(1, 'minute')
					return Object.assign({}, rawEvent, {
						start: { dateTime: start.toISOString() },
						end: { dateTime: end.toISOString() }
					})
				})
				rawEvents = rawEvents.slice(0, 1)
			}
			return rawEvents
		})
		.catch(err => {
			console.warn('FAILED TO FETCH EVENTS FROM:', url, err)
			return []
		})
}

/**
 * Hydrate the event.
 *
 * Why here instead of getInitialProps?
 * Because "Data returned from getInitialProps is serialized when server rendering, similar to a JSON.stringify. Make sure the returned object from getInitialProps is a plain Object and not using Date, Map or Set.".
 * As such, getInitialProps would turn the date instances into strings.
 *
 * Why do this at all?
 * To pevent components having to redo the same calculations on each render.
 * To ensure that events start at second:0, millisecond:0, as otherwise weird bugs occur in time comparisons and display.
 */
export function enrichEvent(rawEvent: RawEventType): RichEventType {
	const description = firstLine(rawEvent.description || '')
	const summary = rawEvent.summary || 'Untitled'
	const start = new Daet(rawEvent.start.dateTime).reset('second')
	const end = new Daet(rawEvent.end.dateTime).reset('second')
	const expires = DEVELOPMENT
		? end.plus(1, 'minute')
		: end.plus(expiresValue, expiresUnit)
	return Object.assign({}, rawEvent, {
		description,
		summary,
		start,
		end,
		expires
	})
}

export function enrichEvents(rawEvents: RawEventsType): RichEventsType {
	return rawEvents.map(enrichEvent)
}
