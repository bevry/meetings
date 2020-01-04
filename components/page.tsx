import React from 'react'
import Head from 'next/head'
import translations from '@shopify/polaris/locales/en.json'
import { AppProvider, Page as PolarisPage, Frame } from '@shopify/polaris'
import { Children, Child } from '../shared/types'

interface LayoutProps {
	children: Children | Child
	title?: string
}

function Page({ children, title = 'Bevry Meetings' }: LayoutProps) {
	return (
		<div>
			<Head>
				<title key="title">{title}</title>
				<meta
					key="viewport"
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<meta name="keywords" content="bevry, discussion, meetings, meet" />
				<link
					rel="stylesheet"
					href="//unpkg.com/@shopify/polaris@4/styles.min.css"
				/>
			</Head>
			<AppProvider i18n={translations}>
				<Frame>
					<PolarisPage fullWidth title={title}>
						{children}
					</PolarisPage>
				</Frame>
			</AppProvider>
		</div>
	)
}

export default Page
