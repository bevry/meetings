// External
import React from 'react'
import { Page } from '@shopify/polaris'

// Internal
import Fountain from '../../components/layout'
import EditEvent from '../../components/events/edit'

// Page
export default function AddEventPage() {
	return (
		<Fountain>
			<Page>
				<EditEvent></EditEvent>
			</Page>
		</Fountain>
	)
}
