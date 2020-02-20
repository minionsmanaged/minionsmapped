import React, { Component } from 'react';
import { withRouter } from 'react-router';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import DomainSummary from './DomainSummary';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    if (props.location && props.location.hash) {
      let filter = props.location.hash
        .replace(/#/, '')
        .split(';')
        .reduce((o, v) => {
          let p = v.split('=')
          o[p[0]] = p[1].split(',');
          return o;
        }, {});
    }
    this.state = {
      domains: [],
      pools: {},
      filter: (props.location && props.location.hash)
        ? {
            ...{
              platform: {},
              provider: {},
              level: {}
            },
            ...props.location.hash
            .replace(/#/, '')
            .split(';')
            .reduce((o1, v1) => {
              let p = v1.split('=')
              o1[p[0]] = p[1].split(',').reduce((o2, v2) => {
                o2[((['1', '3', 't'].includes(v2)) ? v2.replace('t', 'test').replace('1', 'one').replace('3', 'three') : v2)] = false;
                return o2;
              }, {});
              return o1;
            }, {}),
          }
        : {
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
        
        let platformFilter = workerPools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => {
          o[v] = (v in this.state.filter.platform)
            ? this.state.filter.platform[v]
            : ((this.props.location.hash.includes('platform=') && !(v in this.state.filter.platform))
              ? true
              : this.props.location.hash.includes('platform=')
                ? true
                : !(
                    (this.props.location.hash.includes('provider=') && this.props.location.hash.includes('aws') && v === 'aws')
                    || (this.props.location.hash.includes('provider=') && this.props.location.hash.includes('azure') && v === 'azure')
                    || (this.props.location.hash.includes('level=') && this.props.location.hash.includes('test'))
                  ));
          return o;
        }, {});
        let providerFilter = workerPools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => {
          o[v] = (v in this.state.filter.provider)
            ? this.state.filter.provider[v]
            : ((this.props.location.hash.includes('provider=') && !(v in this.state.filter.provider))
              ? true
              : this.props.location.hash.includes('provider=')
                ? true
                : (
                    (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('google') && v.endsWith('-gcp'))
                    || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('deleted') && v === 'null-provider')
                    || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('aws') && v === 'aws')
                    || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('azure') && v === 'azure')
                    || !(this.props.location.hash.includes('level=') && this.props.location.hash.includes('test') && !v.includes('-level'))
                  ));
          return o;
        }, {});
        let levelFilter = workerPools.map(wp => {
          if (wp.providerId.includes('-level1-') || (wp.workerPoolId.split('/')[0].endsWith('-1'))) {
            return 'one';
          } else if (wp.providerId.includes('-level3-') || (wp.workerPoolId.split('/')[0].endsWith('-3'))) {
            return 'three';
          } else if (wp.providerId.includes('-test-') || (wp.workerPoolId.split('/')[0].endsWith('-t'))) {
            return 'test';
          }
          return 'none';
        }).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = (v in this.state.filter.level) ? this.state.filter.level[v] : ((this.props.location.hash.includes('level=') && !(v in this.state.filter.level)) ? true : this.props.location.hash.includes('level=')); return o; }, {});
        let pools = Object.assign({}, ...domains.map(domain => ({[domain]: workerPools.filter(wp => wp.workerPoolId.startsWith(domain + '/'))})));
        if ('continuationToken' in container) {
          fetch('https://firefox-ci-tc.services.mozilla.com/api/worker-manager/v1/worker-pools?continuationToken=' + container.continuationToken)
            .then(response => response.json())
            .then(container => {
              workerPools = workerPools.concat(container.workerPools);
              domains = workerPools.map(wp => wp.workerPoolId.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i);
              platformFilter = workerPools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => {
                o[v] = (v in this.state.filter.platform)
                  ? this.state.filter.platform[v]
                  : ((this.props.location.hash.includes('platform=') && !(v in this.state.filter.platform))
                    ? true
                    : this.props.location.hash.includes('platform=')
                      ? true
                      : !(
                          (this.props.location.hash.includes('provider=') && this.props.location.hash.includes('aws') && v === 'aws')
                          || (this.props.location.hash.includes('provider=') && this.props.location.hash.includes('azure') && v === 'azure')
                          || (this.props.location.hash.includes('level=') && this.props.location.hash.includes('test'))
                        ));
                return o;
              }, {});
              providerFilter = workerPools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => {
                o[v] = (v in this.state.filter.provider)
                  ? this.state.filter.provider[v]
                  : ((this.props.location.hash.includes('provider=') && !(v in this.state.filter.provider))
                    ? true
                    : this.props.location.hash.includes('provider=')
                      ? true
                      : (
                          (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('google') && v.endsWith('-gcp'))
                          || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('deleted') && v === 'null-provider')
                          || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('aws') && v === 'aws')
                          || (this.props.location.hash.includes('platform=') && !this.props.location.hash.includes('azure') && v === 'azure')
                          || !(this.props.location.hash.includes('level=') && this.props.location.hash.includes('test') && !v.includes('-level'))
                        ));
                return o;
              }, {});
              levelFilter = workerPools.map(wp => {
                if (wp.providerId.includes('-level1-') || (wp.workerPoolId.split('/')[0].endsWith('-1'))) {
                  return 'one';
                } else if (wp.providerId.includes('-level3-') || (wp.workerPoolId.split('/')[0].endsWith('-3'))) {
                  return 'three';
                } else if (wp.providerId.includes('-test-') || (wp.workerPoolId.split('/')[0].endsWith('-t'))) {
                  return 'test';
                }
                return 'none';
              }).filter((v, i, a) => a.indexOf(v) === i).reduce((o, v) => { o[v] = (v in this.state.filter.level) ? this.state.filter.level[v] : ((this.props.location.hash.includes('level=') && !(v in this.state.filter.level)) ? true : this.props.location.hash.includes('level=')); return o; }, {});
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
        } else {
          this.setState(state => {
            state.domains = domains;
            state.pools = pools;
            state.filter.platform = platformFilter;
            state.filter.provider = providerFilter;
            state.filter.level = levelFilter;
            return state;
          });
        }
      });
  }

  renderDomainSummaryComponent(domain, pools, filter) {
    let domainPlatforms = pools.map(wp => (wp.providerId.endsWith('-gcp')) ? 'google' : (wp.providerId === 'null-provider') ? 'deleted' : wp.providerId).filter((v, i, a) => a.indexOf(v) === i);
    let allDomainPlatformsShouldBeFiltered = domainPlatforms.every(dp => ((dp in filter.platform) && filter.platform[dp]));

    let domainProviders = pools.map(wp => wp.providerId).filter((v, i, a) => a.indexOf(v) === i);
    let allDomainProvidersShouldBeFiltered = domainProviders.every(dp => ((dp in filter.provider) && filter.provider[dp]));

    let allDomainLevelsShouldBeFiltered = false;
    if (domain.endsWith('-1') || domain.endsWith('-3') || domain.endsWith('-t')) {
      let domainLevel = (domain.endsWith('-1')) ? 'one' : (domain.endsWith('-3')) ? 'three' : 'test';
      allDomainLevelsShouldBeFiltered = ((domainLevel in filter.level) && filter.level[domainLevel]);
    } else {
      let domainLevels = pools.map(wp => (wp.providerId.includes('-level1-')) ? 'one' : (wp.providerId.includes('-level3-')) ? 'three' : (wp.providerId.includes('-test-')) ? 'test' : 'none').filter((v, i, a) => a.indexOf(v) === i);
      allDomainLevelsShouldBeFiltered = domainLevels.every(dl => ((dl in filter.level) && filter.level[dl]));
    }

    return ((!allDomainPlatformsShouldBeFiltered) && (!allDomainProvidersShouldBeFiltered) && (!allDomainLevelsShouldBeFiltered))
      ? <DomainSummary domain={domain} pools={pools} filter={filter} key={domain} />
      : '';
  }

  renderDebugData() {
    if (window.location.hostname === 'localhost' && false) {
      return (
        <Row>
          <pre>{JSON.stringify(window.location, null, 2) }</pre>
          <pre>{JSON.stringify(this.props, null, 2) }</pre>
          <pre>{JSON.stringify(this.state.filter, null, 2) }</pre>
        </Row>
      );

    }
    return '';
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
              this.props.history.push('#' + Object.keys(state.filter).filter(fk => Object.values(state.filter[fk]).includes(false)).map(ft => ft + '=' + Object.keys(state.filter[ft]).filter(k => !state.filter[ft][k]).join()).join(';'));
              return state;
            });
            break;
          case 'google':
            this.setState(state => {
              Object.keys(state.filter.provider).filter(provider => provider.endsWith('-gcp')).forEach(provider => {
                state.filter.provider[provider] = !state.filter.platform[filter];
              });
              state.filter.platform[filter] = !state.filter.platform[filter];
              this.props.history.push('#' + Object.keys(state.filter).filter(fk => Object.values(state.filter[fk]).includes(false)).map(ft => ft + '=' + Object.keys(state.filter[ft]).filter(k => !state.filter[ft][k]).join()).join(';'));
              return state;
            });
            break;
          case 'deleted':
            this.setState(state => {
              state.filter.provider['null-provider'] = !state.filter.platform[filter];
              state.filter.platform[filter] = !state.filter.platform[filter];
              this.props.history.push('#' + Object.keys(state.filter).filter(fk => Object.values(state.filter[fk]).includes(false)).map(ft => ft + '=' + Object.keys(state.filter[ft]).filter(k => !state.filter[ft][k]).join()).join(';'));
              return state;
            });
            break;
          default:
            this.setState(state => {
              state.filter[filterType][filter] = !state.filter[filterType][filter];
              this.props.history.push('#' + Object.keys(state.filter).filter(fk => Object.values(state.filter[fk]).includes(false)).map(ft => ft + '=' + Object.keys(state.filter[ft]).filter(k => !state.filter[ft][k]).join()).join(';'));
              return state;
            });
            break;
        }
        break;
      default:
        this.setState(state => {
          state.filter[filterType][filter] = !state.filter[filterType][filter];
          this.props.history.push('#' + Object.keys(state.filter).filter(fk => Object.values(state.filter[fk]).includes(false)).map(ft => ft + '=' + Object.keys(state.filter[ft]).filter(k => !state.filter[ft][k]).join()).join(';'));
          return state;
        });
        break;
    }
  }

  render() {
    return (
      <Container>
        <Row>
          <Col xs={10}>
            <h2>taskcluster pools</h2>
            {this.state.domains.map((domain) => (
              this.renderDomainSummaryComponent(domain, this.state.pools[domain], this.state.filter)
            ))}
          </Col>
          <Col>
            <h5>selection filters</h5>
            {Object.keys(this.state.filter).map((filterType) => (
              <Form>
                <hr />
                <h6>{filterType}s</h6>
                {Object.keys(this.state.filter[filterType]).map((filter) => (
                  <Form.Check type="checkbox" onChange={this.handleFilterChange} checked={!this.state.filter[filterType][filter]} label={filter} id={'filter_' + filterType + '_' + filter} key={'filter_' + filterType + '_' + filter} />
                ))}
              </Form>
            ))}
            {this.renderDebugData()}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(App);