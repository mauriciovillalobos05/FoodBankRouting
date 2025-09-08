
type Role = 'staff' | 'volunteer' | null

export function useRole(){
    const role: Role = null
    return {
        role
    }
}