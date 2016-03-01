import {Observable} from 'rx'

function nestedComponent({path$, value$}, sources) {
  return path$.zip(value$,
    (path, value) => value({...sources, router: sources.router.path(path)})
  ).shareReplay(1)
}

const mergeOrFlatMapLatest = (prop, ...sourceArray) =>
  Observable.merge(
    sourceArray.map(src => // array map not observable!
      src.source ? // if it has .source, its observable
        src.flatMapLatest(l => l[prop] || Observable.empty()) :
        // otherwise look for a prop
        src[prop] || Observable.empty()
    )
  )

export {nestedComponent, mergeOrFlatMapLatest}
