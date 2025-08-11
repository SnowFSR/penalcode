import { appConfig } from "@/config/app"

export function AppLogo() {
    return (
        <div className='flex items-center gap-2'>
            <img
                src="avatars/unscripted.png"            // <-- file in public/
                alt={`${appConfig.author.name} logo`}
                className="h-15 w-15"
            />
            <span className="font-semibold text-nowrap mr-15">{appConfig.name}</span>
        </div>
    )
}