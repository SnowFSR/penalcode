import {
    Book,
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
        title: 'Penalcode',
        url: '/',
        icon: Book
    },
    {
        title: 'Caselaw',
        url: '/caselaw',
        icon: Book
    },
    {
        title: 'Other',
        url: '/other',
        icon: Book
    },
]
