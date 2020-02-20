import React, { Component } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import PoolSummary from './PoolSummary';


class DomainSummary extends Component {

  constructor(props) {
    super(props);
    this.state = {
      platforms: this.props.pools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i),
      providers: this.props.pools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i)
    };
  }

  renderPoolSummaryComponent(pool, filter) {
    let platform;
    if (pool.providerId in filter.platform) {
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
    return ((!filter.platform[platform]) && (!filter.provider[pool.providerId]) && (!filter.level[level]))
      ? <PoolSummary pool={pool} key={pool.workerPoolId} />
      : '';
  }

  render() {
    return (
      <Card style={{marginTop: '10px'}}>
        <Card.Header>
            <strong>
              {this.props.domain}
            </strong>
            <small className="text-muted font-weight-light float-right">
              {this.props.pools.length} pool{(this.props.pools.length === 1) ? '' : 's'},
              &nbsp;{this.state.platforms.length} platform{(this.state.platforms.length === 1) ? '' : 's'},
              &nbsp;{this.state.providers.length} provider{(this.state.providers.length === 1) ? '' : 's'}
            </small>
        </Card.Header>
        <ListGroup className="list-group-flush">
          {this.props.pools.map((pool) => (
            this.renderPoolSummaryComponent(pool, this.props.filter)
          ))}
        </ListGroup>
      </Card>
    );
  }
}

export default DomainSummary;