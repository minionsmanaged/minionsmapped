import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import PoolSummary from './PoolSummary';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      domains: [],
      pools: {},
      filter: {
        platform: {},
        provider: {},
        level: {}
      }
    };
    this.queryTaskcluster = this.queryTaskcluster.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
  }
  
  componentDidMount() {
    this.queryTaskcluster();
  }
  
  queryTaskcluster() {
    let workerPools = [];
    fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools')
      .then(response => response.json())
      .then(container => {
        workerPools = workerPools.concat(container.workerPools);
        let domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
        let platformFilter = workerPools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
        let providerFilter = workerPools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
        let levelFilter = workerPools.map(wp => {
          if (wp.providerId.includes('-level1-') || (wp.workerPoolId.split('/')[0].endsWith('-1'))) {
            return 'one';
          } else if (wp.providerId.includes('-level3-') || (wp.workerPoolId.split('/')[0].endsWith('-3'))) {
            return 'three';
          } else if (wp.providerId.includes('-test-') || (wp.workerPoolId.split('/')[0].endsWith('-t'))) {
            return 'test';
          }
          return 'none';
        }).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
        let pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
        this.setState(state => {
          state.domains = domains;
          state.pools = pools;
          state.filter.platform = platformFilter;
          state.filter.provider = providerFilter;
          state.filter.level = levelFilter;
          return state;
        });
        if ('continuationToken' in container) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              workerPools = workerPools.concat(container.workerPools);
              domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
              platformFilter = workerPools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
              providerFilter = workerPools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
              levelFilter = workerPools.map(wp => {
                if (wp.providerId.includes('-level1-') || (wp.workerPoolId.split('/')[0].endsWith('-1'))) {
                  return 'one';
                } else if (wp.providerId.includes('-level3-') || (wp.workerPoolId.split('/')[0].endsWith('-3'))) {
                  return 'three';
                } else if (wp.providerId.includes('-test-') || (wp.workerPoolId.split('/')[0].endsWith('-t'))) {
                  return 'test';
                }
                return 'none';
              }).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = false; return o; }, {});
              pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
              this.setState(state => {
                state.domains = domains;
                state.pools = pools;
                state.filter.platform = platformFilter;
                state.filter.provider = providerFilter;
                state.filter.level = levelFilter;
                return state;
              });
            });
        }
      });
  }

  renderPoolSummaryComponent(pool) {
    let platform;
    if (pool.providerId in this.state.filter.platform) {
      platform = pool.providerId;
    } else if (pool.providerId.endsWith('-gcp')) {
      platform = 'google';
    }
    let level;
    if (pool.providerId.includes('-level1-') || (pool.workerPoolId.split('/')[0].endsWith('-1'))) {
      level = 'one';
    } else if (pool.providerId.includes('-level3-') || (pool.workerPoolId.split('/')[0].endsWith('-3'))) {
      level = 'three';
    } else if (pool.providerId.includes('-test-') || (pool.workerPoolId.split('/')[0].endsWith('-t'))) {
      level = 'test';
    } else {
      level = 'none';
    }
    return ((!this.state.filter.platform[platform]) && (!this.state.filter.provider[pool.providerId]) && (!this.state.filter.level[level]))
      ? <PoolSummary pool={pool} key={pool.workerPoolId} />
      : '';
  }

  handleFilterChange(event) {
    let id = event.target.id.split('_');
    let filterType = id[1];
    let filter = id[2];
    switch (filterType) {
      case 'platform':
        switch (filter) {
          case 'aws':
          case 'azure':
            this.setState(state => {
              state.filter.provider[filter] = !state.filter.platform[filter];
              state.filter.platform[filter] = !state.filter.platform[filter];
              return state;
            });
            break;
          case 'google':
            this.setState(state => {
              Object.keys(state.filter.provider).filter(provider => provider.endsWith('-gcp')).forEach(provider => {
                state.filter.provider[provider] = !state.filter.platform[filter];
              });
              state.filter.platform[filter] = !state.filter.platform[filter];
              return state;
            });
            break;
          case 'deleted':
            this.setState(state => {
              state.filter.provider['null-provider'] = !state.filter.platform[filter];
              state.filter.platform[filter] = !state.filter.platform[filter];
              return state;
            });
            break;
          default:
            this.setState(state => (state.filter[filterType][filter] = !state.filter[filterType][filter], state));
            break;
        }
        break;
      default:
        this.setState(state => (state.filter[filterType][filter] = !state.filter[filterType][filter], state));
        break;
    }
    
  }

  render() {
    return (
      <Container>
        {Object.keys(this.state.filter).map((filterType) => (
          <Row>
            {filterType}s:&nbsp;
            <Form>
              {Object.keys(this.state.filter[filterType]).map((filter) => (
                <Form.Check inline type="checkbox" onChange={this.handleFilterChange} checked={!this.state.filter[filterType][filter]} label={filter} id={'filter_' + filterType + '_' + filter} key={'filter_' + filterType + '_' + filter} />
              ))}
            </Form>
          </Row>
        ))}
        <Row>
          <ul>
          {this.state.domains.map((domain) => (
            <li key={domain}>
              {domain}
              <ul className="fa-ul">
                {this.state.pools[domain].map((pool) => (
                  this.renderPoolSummaryComponent(pool)
                ))}
              </ul>
            </li>
          ))}
          </ul>
        </Row>
      </Container>
    );
  }
}

export default App;