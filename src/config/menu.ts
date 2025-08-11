import {
    Book,
    Scale,
    Gavel,
    ScrollText,
    LucideIcon
} from 'lucide-react'

type MenuItemType = {
    title: string
    url: string
    external?: string
    icon?: LucideIcon
    items?: MenuItemType[]
}
type MenuType = MenuItemType[]

export const mainMenu: MenuType = [
    {
        title: 'Penal Code',
        url: '/',
        icon: Book
    },
    {
        title: 'Case Law',
        url: '/caselaw',
        icon: Gavel
    },
    {
        title: 'Amendments',
        url: '/amendments',
        icon: ScrollText
    },
    {
        title: 'Legal Concepts',
        url: '/concepts',
        icon: Scale
    },
]
