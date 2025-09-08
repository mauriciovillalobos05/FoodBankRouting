import { useState } from 'react'

type User = {
    id: string
}

export function useAuth(){
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    return {
        user, loading
    }
}