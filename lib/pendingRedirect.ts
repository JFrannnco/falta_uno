/**
 * A dónde iba la persona cuando `_layout.tsx` la interceptó para mandarla a
 * loguearse (o a completar su perfil). Sin esto, tocar un link compartido
 * tipo `faltauno://match/123` sin sesión iniciada terminaba, después del
 * login, en la lista general de partidos — el destino original del link se
 * perdía en el camino.
 *
 * Mismo patrón que `locationStore.ts`: una variable de módulo, no contexto
 * ni estado global, porque es un valor que vive de un salto de pantalla al
 * siguiente y nada más.
 */
let pendingPath: string | null = null

export const setPendingRedirect = (path: string) => {
  pendingPath = path
}

export const getPendingRedirect = () => pendingPath

export const clearPendingRedirect = () => {
  pendingPath = null
}
