const { expect }          = require('chai');
const { validateOptions } = require('../src/validation');

// Wrap the options to test in a minimal valid option object
const validate = options => validateOptions({ baseURL: 'https://url.com', routes: [{ path: '/' }], ...options });

describe("the validation of the options returns an error when:", () => {

	/**
	 * Meta
	 * ---------------------------------------------------------------------
	 */
	it("there are extra properties on the main options object", () => {
		expect(() => validate({ someProp: true })).to.throw();
	});

	it("neither routes nor URLs are provided", () => {
		expect(() => validateOptions({ pretty: true, baseURL: 'https://whatever.com' })).to.throw();
		expect(() => validateOptions({ urls: [], routes: []                          })).to.throw();
	});

	/**
	 * Global options
	 * ---------------------------------------------------------------------
	 */
	it("'outputDir' is not a string", () => {
		expect(() => validate({ outputDir: true        })).to.throw();
		expect(() => validate({ outputDir: 10          })).to.throw();

		expect(() => validate({ outputDir: './sitemap' })).to.not.throw();
	});

	it("'baseURL' is not a proper URI or IPv4 address", () => {
		expect(() => validate({ baseURL: 'not an URI'                  })).to.throw();
		expect(() => validate({ baseURL: 'somedomain.wtf'              })).to.throw();
		expect(() => validate({ baseURL: 'https://missing-something'   })).to.throw();
		expect(() => validate({ baseURL: '127.0'                       })).to.throw();

		expect(() => validate({ baseURL: 'https://example.fr'          })).to.not.throw();
		expect(() => validate({ baseURL: 'http://www.example.fr'       })).to.not.throw();
		expect(() => validate({ baseURL: 'http://www.example.com:8080' })).to.not.throw();
		expect(() => validate({ baseURL: 'https://example.com:27'      })).to.not.throw();
		expect(() => validate({ baseURL: 'https://127.0.0.1'           })).to.not.throw();
		expect(() => validate({ baseURL: 'https://127.0.0.1:8000'      })).to.not.throw();
	});

	describe("the default URL meta tags are invalid, because", () => {

		it("`defaults` is not an object", () => {
			expect(() => validate({ defaults: true     })).to.throw();
			expect(() => validate({ defaults: 'weekly' })).to.throw();
		});

		it("`defaults` has extraneous properties", () => {
			expect(() => validate({ defaults: { loc:  '/lorem/ipsum' } })).to.throw();
			expect(() => validate({ defaults: { path: '/lorem/ipsum' } })).to.throw();
			expect(() => validate({ defaults: { path: '/lorem/ipsum' } })).to.throw();
		});

		it("`lastmod` is not a Date object or a string", () => {
			expect(() => validate({ defaults: { lastmod: true                   } })).to.throw();
			expect(() => validate({ defaults: { lastmod: { date: '2012-12-21' } } })).to.throw();
		});

		it("`lastmod` is an invalid Date object", () => {
			expect(() => validate({ defaults: { lastmod: new Date('the first day of the universe')     } })).to.throw();
			expect(() => validate({ defaults: { lastmod: new Date('last tuesday, when it was raining') } })).to.throw();
			expect(() => validate({ defaults: { lastmod: new Date('1867/45/90')                        } })).to.throw();

			expect(() => validate({ defaults: { lastmod: new Date('2019-12-28')                        } })).to.not.throw();
			expect(() => validate({ defaults: { lastmod: new Date('2019-12-28T21:17:34')               } })).to.not.throw();
		});

		it("`lastmod` is an invalid date", () => {
			expect(() => validate({ defaults: { lastmod: 'the first day of the universe'     } })).to.throw();
			expect(() => validate({ defaults: { lastmod: 'last tuesday, when it was raining' } })).to.throw();
			expect(() => validate({ defaults: { lastmod: '1867/45/90'                        } })).to.throw();

			expect(() => validate({ defaults: { lastmod: '2019-12-28'                        } })).to.not.throw();
			expect(() => validate({ defaults: { lastmod: '2019-12-28T21:17:34'               } })).to.not.throw();
		});

		it("`lastmod` is an invalid timestamp", () => {
			expect(() => validate({ defaults: { lastmod: 99999999999999999 } })).to.throw();

			expect(() => validate({ defaults: { lastmod: 1578485452000     } })).to.not.throw();
		});

		it("`changefreq` is not a valid value", () => {
			expect(() => validate({ defaults: { changefreq: 25                 } })).to.throw();
			expect(() => validate({ defaults: { changefreq: 'often'            } })).to.throw();
			expect(() => validate({ defaults: { changefreq: 'sometimes'        } })).to.throw();
			expect(() => validate({ defaults: { changefreq: 'every 12 seconds' } })).to.throw();

			expect(() => validate({ defaults: { changefreq: 'monthly'          } })).to.not.throw();
			expect(() => validate({ defaults: { changefreq: 'never'            } })).to.not.throw();
		});

		it("`priority` is not a valid value", () => {
			expect(() => validate({ defaults: { priority: 'high' } })).to.throw();
			expect(() => validate({ defaults: { priority: 100    } })).to.throw();
			expect(() => validate({ defaults: { priority: 100.0  } })).to.throw();
			expect(() => validate({ defaults: { priority: 1.1    } })).to.throw();
			expect(() => validate({ defaults: { priority: 0.88   } })).to.throw();
			expect(() => validate({ defaults: { priority: -1.0   } })).to.throw();

			expect(() => validate({ defaults: { priority: 0.3    } })).to.not.throw();
			expect(() => validate({ defaults: { priority: 0.8    } })).to.not.throw();
			expect(() => validate({ defaults: { priority: 0.0    } })).to.not.throw();
			expect(() => validate({ defaults: { priority: 0.1    } })).to.not.throw();
		});
	});

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	describe("the routes are invalid, because", () => {

		it("`routes` is not an array", () => {
			expect(() => validateOptions({ routes: {}                              })).to.throw();
			expect(() => validateOptions({ routes: true                            })).to.throw();
			expect(() => validateOptions({ routes: [{ path: '/', children: {}   }] })).to.throw();
			expect(() => validateOptions({ routes: [{ path: '/', children: true }] })).to.throw();
		});

		it("there is a route with no `path` property", () => {
			expect(() => validate({ routes: [{}                                                            ] })).to.throw();
			expect(() => validate({ routes: [{ path: '/' }, {}                                             ] })).to.throw();
			expect(() => validate({ routes: [{ meta: { sitemap: { changefreq: 'weekly' } } }               ] })).to.throw();
			expect(() => validate({ routes: [{ path: '/' }, { meta: { sitemap: { changefreq: 'weekly' } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{}]                                  }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ meta: {} }]                        }] })).to.throw();

			expect(() => validate({ routes: [{ path: '/' }                                                 ] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/' }, { path: '/about' }                             ] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/about' }] }                 ] })).to.not.throw();
		});

		it("there is a route with an invalid `path` property", () => {
			expect(() => validate({ routes: [{ path: 2     }] })).to.throw();
			expect(() => validate({ routes: [{ path: true  }] })).to.throw();
			expect(() => validate({ routes: [{ path: ['/'] }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: 2     }] }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: true  }] }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: ['/'] }] }] })).to.throw();
		});

		it("there is a route with an invalid `loc` property", () => {
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { loc: true                               } }}] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { loc: 22                                 } }}] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { loc: ['/other']                         } }}] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { loc: true       } }}] } ]})).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { loc: 22         } }}] } ]})).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { loc: ['/other'] } }}] } ]})).to.throw();

			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { loc: '/other'                           } }}] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { loc: '/other'   } }}] } ]})).to.not.throw();
		});

		it("there is a route with invalid URL properties", () => {
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { changefreq: true                                } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { lastmod:    'yesterday'                         } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', meta: { sitemap: { priority:   72                                  } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { changefreq: true        } } }] } ]})).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { lastmod:    'yesterday' } } }] } ]})).to.throw();
			expect(() => validate({ routes: [{ path: '/', children: [{ path: '/', meta: { sitemap: { priority:   72          } } }] } ]})).to.throw();
		});

		it("a route has invalid slugs", () => {
			// Property 'slugs' is object
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: {}                                        } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/article/:title', meta: { sitemap: { slugs: { title: 'title' }                        } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/article/:title', meta: { sitemap: { slugs: { title: {} }                             } } }] })).to.throw();
			// Non-string/number value
			expect(() => validate({ routes: [{ path: '/article/:title', meta: { sitemap: { slugs: [false, 'title']                          } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/article/:title', meta: { sitemap: { slugs: { title: null }                           } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/article/:title', meta: { sitemap: { slugs: { title: {} }                             } } }] })).to.throw();
			// No value for slug
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: [{}]                                      } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: [{ changefreq: 'yearly', priority: 1.0 }] } } }] })).to.throw();

			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: ['ok', 'pseudo']                          } } }] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: ['ok', { pseudo: 'pseudo'}]               } } }] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: [{ pseudo: 'ok' }]                        } } }] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: [{ pseudo: 'ok', priority: 0.2 }]         } } }] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs:       () => ['ok']                        } } }] })).to.not.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo',   meta: { sitemap: { slugs: async () => ['ok']                        } } }] })).to.not.throw();
		});

		it("a route has slugs with invalid meta tags", () => {
			expect(() => validate({ routes: [{ path: '/user/:pseudo', meta: { sitemap: { slugs: [{ pseudo: 'pseudo', priority: 22              }] } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo', meta: { sitemap: { slugs: [{ pseudo: 'pseudo', priority: 'high'          }] } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo', meta: { sitemap: { slugs: [{ pseudo: 'pseudo', lastmod: 'a while ago'    }] } } }] })).to.throw();
			expect(() => validate({ routes: [{ path: '/user/:pseudo', meta: { sitemap: { slugs: [{ pseudo: 'pseudo', changefreq: 'a whole lot' }] } } }] })).to.throw();
		});
	});

	/**
	 * URLs
	 * ---------------------------------------------------------------------
	 */
	describe("the URLs are invalid, because", () => {

		it("the `urls` property is not an array", () => {
			expect(() => validateOptions({ urls: {}                                })).to.throw();
			expect(() => validateOptions({ urls: 'https://example.com'             })).to.throw();

			expect(() => validateOptions({ urls: ['https://www.site.org']          })).to.not.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://www.site.org' }] })).to.not.throw();
		});

		it("some URLs are missing the `loc` property", () => {
			expect(() => validateOptions({ urls: [{}]                                                          })).to.throw();
			expect(() => validateOptions({ urls: [{ lastmod: '2020-01-01' }]                                   })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'about' }, { changefreq: 'always' }]                  })).to.throw();

			expect(() => validateOptions({ urls: ['https://example.com', { loc: 'https://example.com/about' }] })).to.not.throw();
		});

		it("the locations are full URIs even though a base URL is provided", () => {
			expect(() => validateOptions({ baseURL: 'https://example.com',     urls: ['https://example.com/about']              })).to.throw();
			expect(() => validateOptions({ baseURL: 'https://example.com',     urls: [{ loc: 'https://example.com/about' }]     })).to.throw();
			expect(() => validateOptions({ baseURL: 'https://www.example.net', urls: ['https://www.example.net/about']          })).to.throw();
			expect(() => validateOptions({ baseURL: 'https://www.example.net', urls: [{ loc: 'https://www.example.net/about' }] })).to.throw();

			expect(() => validateOptions({ baseURL: 'https://example.com',     urls: ['/about']                                 })).to.not.throw();
			expect(() => validateOptions({ baseURL: 'https://example.com',     urls: [{ loc: '/about' }]                        })).to.not.throw();
			expect(() => validateOptions({ baseURL: 'https://www.example.net', urls: ['about']                                  })).to.not.throw();
			expect(() => validateOptions({ baseURL: 'https://www.example.net', urls: [{ loc: 'about' }]                         })).to.not.throw();
		});

		it("the locations are partial URIs even though no base URL is provided", () => {
			expect(() => validateOptions({ urls: ['/about']          })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: '/about' }] })).to.throw();
			expect(() => validateOptions({ urls: ['about']           })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'about' }]  })).to.throw();
		});

		it("there is an URL with invalid URL properties", () => {
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', changefreq: false                    }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', changefreq: {}                       }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', changefreq: 'sometimes'              }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', lastmod: true                        }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', lastmod: 'yesterday'                 }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', priority: 'low'                      }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', priority: 'high'                     }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', priority: 10                         }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { changefreq: false       } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { changefreq: {}          } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { changefreq: 'sometimes' } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { lastmod: true           } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { lastmod: 'yesterday'    } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { priority: 'low'         } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { priority: 'high'        } }] })).to.throw();
			expect(() => validateOptions({ urls: [{ loc: 'https://example.com', sitemap: { priority: 10            } }] })).to.throw();
		});
	});
});
