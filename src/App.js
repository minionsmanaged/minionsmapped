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
        platform: {
          aws: false,
          azure: false,
          google: false
        }
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
        let pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
        this.setState({ domains, pools });
        if ('continuationToken' in container) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              workerPools = workerPools.concat(container.workerPools);
              domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
              pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
              this.setState({ domains, pools });
            });
        }
      });
  }

  renderPoolSummaryComponent(pool) {
    if (pool.providerId in this.state.filter.platform) {
      return (!this.state.filter.platform[pool.providerId]) ? <PoolSummary pool={pool} key={pool.workerPoolId} /> : '';
    } else if (pool.providerId.endsWith('-gcp')) {
      return (!this.state.filter.platform.google) ? <PoolSummary pool={pool} key={pool.workerPoolId} /> : '';
    }
    return <PoolSummary pool={pool} key={pool.workerPoolId} />;
  }

  handleFilterChange(event) {
    let platform = event.target.id.split('-')[1];
    this.setState(state => (state.filter.platform[platform] = !state.filter.platform[platform], state));
  }

  render() {
    return (
      <Container>
        <Row>
          <Form>
            {Object.keys(this.state.filter.platform).map((platform) => (
              <Form.Check inline type="checkbox" onChange={this.handleFilterChange} checked={!this.state.filter.platform[platform]} label={platform} id={'filter-' + platform} key={platform} />
            ))}
          </Form>
        </Row>
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