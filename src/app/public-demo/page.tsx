'use client'

import { PublicListView } from '@/components/public-list-view'
import { ListWithLinks } from '@/types'

// Mock public list data matching the Figma design
const mockPublicList: ListWithLinks = {
  id: '1',
  title: 'Absolute Must Go Places in NYC',
  emoji: '🗽',
  is_public: true,
  price_cents: null,
  user_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  links: [
    {
      id: '1',
      url: 'https://paper.design',
      title: 'Paper – design, share, ship',
      favicon_url: null,
      image_url: null,
      position: 0,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      url: 'https://eventually.app',
      title: 'Notion – all-in-one workspace',
      favicon_url: null,
      image_url: null,
      position: 1,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      url: 'https://airdroid.com',
      title: 'Miro – online brainstorming',
      favicon_url: null,
      image_url: null,
      position: 2,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      url: 'https://highlightsapp.net',
      title: 'Figma – design collaboration',
      favicon_url: null,
      image_url: null,
      position: 3,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      url: 'https://paper.design',
      title: 'Paper – design, share, ship',
      favicon_url: null,
      image_url: null,
      position: 4,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      url: 'https://eventually.app',
      title: 'Notion – all-in-one workspace',
      favicon_url: null,
      image_url: null,
      position: 5,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7',
      url: 'https://airdroid.com',
      title: 'Miro – online brainstorming',
      favicon_url: null,
      image_url: null,
      position: 6,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '8',
      url: 'https://highlightsapp.net',
      title: 'Figma – design collaboration',
      favicon_url: null,
      image_url: null,
      position: 7,
      list_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  user: {
    id: '1',
    username: 'Rick Sanchez'
  }
}

export default function PublicDemoPage() {
  return (
    <PublicListView 
      list={mockPublicList}
    />
  )
}