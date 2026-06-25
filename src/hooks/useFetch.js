import { useEffect, useState } from 'react'

// Hook générique de chargement asynchrone : { data, loading, error }.
// `fn` est rappelée quand `deps` change ; le résultat obsolète est ignoré
// si le composant change de dépendances ou se démonte (garde `active`).
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve(fn())
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
