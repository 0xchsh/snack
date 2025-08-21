'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { ListEditor } from '@/components/list-editor'
import { PublicListView } from '@/components/public-list-view'
import { CreateList } from '@/components/create-list'
import { ListWithLinks, CreateListForm, LinkInsert } from '@/types'
import { getRandomEmoji } from '@/lib/emoji'

// Mock data - in real app this would come from database
const mockList: ListWithLinks = {
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
    }
  ],
  user: {
    id: '1',
    username: 'Rick Sanchez'
  }
}

interface ListPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params
  const [lists, setLists] = useState<ListWithLinks[]>([mockList])
  const [showCreateList, setShowCreateList] = useState(false)
  
  // Mock auth state - in real app this would come from auth context
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const currentList = lists.find(list => list.id === id) || mockList
  
  // Determine if user can edit this list
  const canEdit = isAuthenticated && currentUserId === currentList.user_id
  
  // Determine if list should be visible
  const canView = currentList.is_public || canEdit

  const handleCreateList = (formData: CreateListForm) => {
    const newList: ListWithLinks = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...formData,
      emoji: formData.emoji || getRandomEmoji(),
      price_cents: formData.price_cents || null,
      user_id: currentUserId || '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      links: [],
      user: {
        id: currentUserId || '1',
        username: 'demo'
      }
    }

    setLists(prev => [...prev, newList])
    setShowCreateList(false)
  }

  const handleUpdateList = (updates: Partial<ListWithLinks>) => {
    setLists(prev => prev.map(list => 
      list.id === currentList.id
        ? { ...list, ...updates, updated_at: new Date().toISOString() }
        : list
    ))
  }

  const handleAddLink = (linkData: LinkInsert) => {
    const newLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...linkData,
      title: linkData.title || new URL(linkData.url).hostname,
      favicon_url: `https://${new URL(linkData.url).hostname}/favicon.ico`,
      image_url: null,
      position: currentList?.links?.length || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setLists(prev => prev.map(list =>
      list.id === currentList.id
        ? { ...list, links: [...(list.links || []), newLink] }
        : list
    ))
  }

  const handleRemoveLink = (linkId: string) => {
    setLists(prev => prev.map(list =>
      list.id === currentList.id
        ? { ...list, links: list.links?.filter(link => link.id !== linkId) || [] }
        : list
    ))
  }

  const handleReorderLinks = (linkIds: string[]) => {
    setLists(prev => prev.map(list => {
      if (list.id !== currentList.id) {
        return list
      }
      
      const linkMap = new Map(list.links?.map(link => [link.id, link]) || [])
      const reorderedLinks = linkIds.map(id => linkMap.get(id)).filter(Boolean) as typeof list.links
      
      const updatedLinks = reorderedLinks.map((link, index) => ({
        ...link,
        position: index,
        updated_at: new Date().toISOString()
      }))
      
      return { ...list, links: updatedLinks }
    }))
  }


  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUserId(null)
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">List not found</h1>
          <p className="text-muted-foreground">This list is private or doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  // Show public view for non-authenticated users or non-owners
  if (!canEdit) {
    return <PublicListView list={currentList} />
  }

  // Show editable view for authenticated owners
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.svg"
                  alt="Snack"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <h1 
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Open Runde' }}
                >
                  Snack
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-neutral-100 rounded-full"
                style={{ fontFamily: 'Open Runde' }}
              >
                Logout
              </button>
              <button
                onClick={() => setShowCreateList(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                style={{ fontFamily: 'Open Runde' }}
              >
                <Plus className="w-4 h-4" />
                New List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <ListEditor
          list={currentList}
          onUpdateList={handleUpdateList}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
          onReorderLinks={handleReorderLinks}
        />
      </div>

      {showCreateList && (
        <CreateList
          onCreateList={handleCreateList}
          onClose={() => setShowCreateList(false)}
        />
      )}
    </div>
  )
}