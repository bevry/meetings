/* eslint camelcase:0 */
import fetchJSON from '../shared/fetch'
import {
	RawEventType,
	RawEventsType,
	RichEventType,
	RichEventsType
} from '../shared/types'
import Daet from 'daet'
import {
	eventsUrl,
	DEVELOPMENT,
	expiresUnit,
	expiresValue
} from '../shared/config'

function firstLine(str?: string): string {
	return (str || '').split(/\s*(\n|<br>)\s*/)[0]
}

export function fetchRawEvents(): Promise<RawEventsType> {
	return fetchJSON(eventsUrl)
		.then(function(rawEvents: RawEventsType) {
			const now = new Daet()
			// if development, convert the events to more recent ones
			if (DEVELOPMENT) {
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
			console.warn('FAILED TO FETCH EVENTS FROM:', eventsUrl, err)
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
	const description = firstLine(rawEvent.description)
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

export function fetchRichEvents(): Promise<RichEventsType> {
	return fetchRawEvents().then(enrichEvents)
}
