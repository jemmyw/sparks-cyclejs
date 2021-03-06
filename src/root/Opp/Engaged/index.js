import {Observable} from 'rx'
const {of, combineLatest} = Observable

import {TabbedPage} from 'components/ui'

import {
  Engagements,
} from 'components/remote'

import {FilteredView} from './FilteredView'

const filterApplied = e => e.filter(x => !x.isAccepted && !x.declined)
const filterPriority = e => e.filter(x => x.isAccepted && x.priority)
const filterOK = e => e.filter(x => x.isAccepted && !x.priority)
const filterNever = e => e.filter(x => !x.isAccepted && x.declined)
const _Fetch = sources => {
  const e$ = sources.oppKey$
    .flatMapLatest(Engagements.query.byOpp(sources))
    .shareReplay(1)

  return {
    engagements$: e$,
    applied$: e$.map(filterApplied).shareReplay(1),
    priority$: e$.map(filterPriority).shareReplay(1),
    ok$: e$.map(filterOK).shareReplay(1),
    never$: e$.map(filterNever).shareReplay(1),
  }
}

const _TabMaker = sources => ({
  tabs$: combineLatest(
    sources.applied$,
    sources.priority$,
    sources.ok$,
    sources.never$,
    (ap,pr,ok,nv) => [
      {path: '/', label: `${ap.length} Applied`},
      pr.length > 0 && {path: '/priority', label: `${pr.length} Priority`},
      ok.length > 0 && {path: '/ok', label: `${ok.length} OK`},
      nv.length > 0 && {path: '/never', label: `${nv.length} Never`},
    ].filter(x => !!x)
  ),
})

const Applied = sources => FilteredView({...sources,
  engagements$: sources.applied$,
})
const Priority = sources => FilteredView({...sources,
  engagements$: sources.priority$,
})
const OK = sources => FilteredView({...sources,
  engagements$: sources.ok$,
})
const Never = sources => FilteredView({...sources,
  engagements$: sources.never$,
})

export default sources => {
  const _sources = {...sources, ..._Fetch(sources)}

  return {
    pageTitle: of('Engaged Volunteers'),

    ...TabbedPage({..._sources,
      tabs$: _TabMaker(_sources).tabs$,
      routes$: of({
        '/': Applied,
        '/priority': Priority,
        '/ok': OK,
        '/never': Never,
      }),
    }),
  }
}
