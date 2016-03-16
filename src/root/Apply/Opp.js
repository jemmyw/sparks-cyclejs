import combineLatestObj from 'rx-combine-latest-obj'

import {rows} from 'util'
import {log} from 'util'

import {col} from 'helpers'
import listItem from 'helpers/listItem'

import {textQuote} from 'helpers/text'

const _renderOppHeader = (project, opp) =>
  col(
    textQuote(opp.description),
  )

const _renderCommitments = (title, commitmentRows) =>
  col(
    listItem({
      title,
      header: true,
    }),
    ...commitmentRows.map(commitment =>
      listItem({
        title: commitment.description,
      })
    )
  )

const _render = ({
  project,
  opp,
  commitments,
}) =>
  col(
    _renderOppHeader(project,opp),
    _renderCommitments(
      'you GIVE',
      rows(commitments).filter(c => c.party === 'vol')
    ),
    _renderCommitments(
      'you GET',
      rows(commitments).filter(c => c.party === 'proj')
    ),
  )

export default sources => {
  const oppKey$ = sources.oppKey$
  oppKey$.subscribe(log('oppKey$'))

  const opp$ = oppKey$
    .flatMapLatest(oppKey => sources.firebase('Opps',oppKey))

  const commitments$ = oppKey$
    .flatMapLatest(oppKey => sources.firebase('Commitments', {
      orderByChild: 'oppKey',
      equalTo: oppKey,
    }))

  const viewState = {
    project$: sources.project$,
    opp$,
    commitments$,
  }

  const DOM = combineLatestObj(viewState).map(_render)

  return {
    DOM,
  }
}
//   const title = Title({
//     labelText$: project$.pluck('name'),
//     subLabelText$: oppRows$.map(opps =>
//       opps.length + ' Opportunities Available'
//     ),
//     oppRows$,
//     ...sources,
//   })

//   const applyQuickNavMenu = ApplyQuickNavMenu({opps$, project$, ...sources})
//   // const applyQuickNavMenu = Observable.just({DOM: ['foo']})

//   const page$ = nestedComponent(sources.router.define(_routes),sources)

//   const pageDOM = col(
//     title.DOM,
//     applyQuickNavMenu.DOM,
//     page$.flatMapLatest(({DOM}) => DOM)
//   )

//   const frame = SoloFrame({pageDOM, ...sources})

//   const children = [frame, page$, applyQuickNavMenu]

//   const DOM = frame.DOM

//   const route$ = mergeOrFlatMapLatest('route$', ...children)

//   // const queue$ = frame.queue$

//   const auth$ = mergeOrFlatMapLatest('auth$', ...children)

//   return {
//     DOM,
//     route$,
//     // queue$,
//     auth$,
//   }
// }
