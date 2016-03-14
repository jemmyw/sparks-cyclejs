import {Observable} from 'rx'
import combineLatestObj from 'rx-combine-latest-obj'

import listItem from 'helpers/listItem'
import listHeader from 'helpers/listHeader'

import {h, div, span} from 'cycle-snabbdom'

import {rows, log} from 'util'

import CreateTeamHeader from 'components/CreateTeamHeader'
import CreateOppHeader from 'components/CreateOppHeader'

const _navActions = sources => Observable.merge(
  sources.DOM.select('.project.glance').events('click')
    .map(e => '/team/' + e.ownerTarget.dataset.key),
  sources.DOM.select('.team').events('click')
    .map(e => '/team/' + e.ownerTarget.dataset.key),
  sources.DOM.select('.opp').events('click')
    .map(e => '/opp/' + e.ownerTarget.dataset.key),
)

const _teamItems = _rows =>
  _rows.map(({name, $key}) => listItem({title: name, className: 'team', key: $key}))

const _oppItems = _rows =>
  _rows.map(({name, $key}) => listItem({title: name, className: 'opp', key: $key}))


// const _teamHeader = () =>
//   listItem({
//     header: true,
//     title: 'Teams', clickable: true, className: 'teams-list',
//     iconName: 'plus', iconBackgroundColor: 'yellow',
//   })

const _render = ({isMobile, teams, opps, titleDOM, teamListHeaderDOM, oppListHeaderDOM}) => {
  const teamRows = rows(teams)
  const oppRows = rows(opps)
  return div(
    {},
    [
      isMobile ? null : titleDOM,
      h('div.rowwrap', {style: {padding: '0px 15px'}}, [
        listItem({title: 'At a Glance', subtitle: 'Coming Soon!', iconName: 'home', disabled: true}),
        listItem({title: 'Manage', subtitle: 'Coming Soon!', iconName: 'settings', disabled: true}),
        teamRows.length > 0 ? teamListHeaderDOM : null,
        ..._teamItems(teamRows),
        oppRows.length > 0 ? oppListHeaderDOM : null,
        ..._oppItems(oppRows),
      ]),
    ]
  )
}

export default sources => {
  const route$ = _navActions(sources)

  const teamListHeader = CreateTeamHeader(sources)
  const oppListHeader = CreateOppHeader(sources)

  const queue$ = Observable.merge(
    teamListHeader.queue$,
    oppListHeader.queue$,
  )

  const viewState$ = {
    isMobile$: sources.isMobile$,
    teamListHeaderDOM$: teamListHeader.DOM,
    oppListHeaderDOM$: oppListHeader.DOM,
    teams$: sources.teams$,
    opps$: sources.opps$,
    titleDOM$: sources.titleDOM,
  }

  const DOM = combineLatestObj(viewState$).map(_render)

  return {DOM, route$, queue$}
}
