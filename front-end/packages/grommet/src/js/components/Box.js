// (C) Copyright 2014-2016 Hewlett Packard Enterprise Development LP

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import KeyboardAccelerators from '../utils/KeyboardAccelerators';
import Intl from '../utils/Intl';
import Props from '../utils/Props';
import { checkDarkBackground } from '../utils/DOM';
import SkipLinkAnchor from './SkipLinkAnchor';
import CSSClassnames from '../utils/CSSClassnames';
import { announce } from '../utils/Announcer';

const CLASS_ROOT = CSSClassnames.BOX;
const BACKGROUND_COLOR_INDEX = CSSClassnames.BACKGROUND_COLOR_INDEX;

export default class Box extends Component {
  constructor(props) {
    super(props);
    this.state = { mouseActive: false };
  }

  componentDidMount() {
    const { onClick } = this.props;
    if (onClick) {
      let clickCallback = () => {
        if (this.boxContainerRef === document.activeElement) {
          onClick();
        }
      };

      KeyboardAccelerators.startListeningToKeyboard(this, {
        enter: clickCallback,
        space: clickCallback
      });
    }

    this._setDarkBackground();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.colorIndex !== this.props.colorIndex) {
      if (nextProps.colorIndex) {
        this.setState({ updateDarkBackground: true });
      } else {
        this.setState({ darkBackground: undefined });
      }
    }
  }

  componentDidUpdate() {
    if (this.props.announce) {
      announce(this.boxContainerRef.textContent);
    }
    if (this.state.updateDarkBackground) {
      this.setState({ updateDarkBackground: false });
      this._setDarkBackground();
    }
  }

  componentWillUnmount() {
    if (this.props.onClick) {
      KeyboardAccelerators.stopListeningToKeyboard(this);
    }
    if (this._checkBackground) {
      this._checkBackground.stop();
    }
  }

  _setDarkBackground() {
    const { colorIndex } = this.props;
    const box = findDOMNode(this.boxContainerRef);
    if (this._checkBackground) {
      this._checkBackground.stop();
    }
    this._checkBackground = checkDarkBackground(
      colorIndex,
      box,
      darkBackground => this.setState({ darkBackground })
    );
  }

  _normalize(string) {
    return string.replace('/', '-');
  }

  _addPropertyClass(classes, property, options = {}) {
    const value = (options.object || this.props)[property];
    const elementName = options.elementName || CLASS_ROOT;
    const prefix = options.prefix || property;
    if (value) {
      if (typeof value === 'string') {
        classes.push(`${elementName}--${prefix}-${this._normalize(value)}`);
      } else if (typeof value === 'object') {
        Object.keys(value).forEach(key => {
          this._addPropertyClass(classes, key, {
            object: value,
            prefix: `${prefix}-${key}`
          });
        });
      } else {
        classes.push(`${elementName}--${this._normalize(prefix)}`);
      }
    }
  }

  _backgroundContextClass(darkBackground) {
    let result;
    if (undefined === darkBackground) {
      result = `${BACKGROUND_COLOR_INDEX}--pending`;
    } else if (darkBackground) {
      result = `${BACKGROUND_COLOR_INDEX}--dark`;
    } else {
      result = `${BACKGROUND_COLOR_INDEX}--light`;
    }
    return result;
  }

  render() {
    const {
      a11yTitle,
      appCentered,
      backgroundImage,
      children,
      className,
      colorIndex,
      containerClassName,
      focusable,
      id,
      onClick,
      onBlur,
      onFocus,
      onMouseDown,
      onMouseUp,
      pad,
      primary,
      role,
      size,
      tabIndex,
      tag,
      texture,
      title,
      card,
      bordered,
      actions,
      actionSize
    } = this.props;
    const { darkBackground, mouseActive } = this.state;
    let classes = [CLASS_ROOT];
    let containerClasses = [`${CLASS_ROOT}__container`];
    let restProps = Props.omit(this.props, Object.keys(Box.propTypes));
    this._addPropertyClass(classes, 'full');
    this._addPropertyClass(classes, 'direction');
    this._addPropertyClass(classes, 'justify');
    this._addPropertyClass(classes, 'align');
    this._addPropertyClass(classes, 'alignContent', {
      prefix: 'align-content'
    });
    this._addPropertyClass(classes, 'alignSelf', { prefix: 'align-self' });
    this._addPropertyClass(classes, 'reverse');
    this._addPropertyClass(classes, 'responsive');
    this._addPropertyClass(classes, 'basis');
    this._addPropertyClass(classes, 'flex');
    this._addPropertyClass(classes, 'pad');
    this._addPropertyClass(classes, 'margin');
    this._addPropertyClass(classes, 'separator');
    this._addPropertyClass(classes, 'textAlign', { prefix: 'text-align' });
    this._addPropertyClass(classes, 'wrap');

    if (this.props.hasOwnProperty('flex')) {
      if (!this.props.flex) {
        classes.push(`${CLASS_ROOT}--flex-off`);
      }
    }
    if (size) {
      if (typeof size === 'object') {
        Object.keys(size).forEach(key => {
          this._addPropertyClass(classes, key, { object: size });
        });
      } else {
        this._addPropertyClass(classes, 'size');
      }
      if (size) {
        if (!(size.width && size.width.max)) {
          // don't apply 100% max-width when size using size.width.max option
          classes.push(`${CLASS_ROOT}--size`);
        }
        if (size.width && size.width.max) {
          // allow widths to shrink, apply 100% width
          classes.push(`${CLASS_ROOT}--width-max`);
        }
      }
    }

    if (card) {
      classes.push(`${CLASS_ROOT}--card`);
    }
    if (bordered) {
      classes.push(`${CLASS_ROOT}--bordered`);
    }
    if (actions && actions.length) {
      classes.push(`${CLASS_ROOT}--with-actions`);
    }
    if (actionSize) {
      classes.push(`${CLASS_ROOT}--action-size-${actionSize}`);
    }

    // needed to properly set flex-basis for 1/3 & 2/3 basis boxes
    if (pad && pad.between && children) {
      if (React.Children.count(children) % 3 === 0) {
        classes.push(`${CLASS_ROOT}--pad-between-thirds`);
      }
    }

    if (appCentered) {
      this._addPropertyClass(containerClasses, 'full', {
        elementName: `${CLASS_ROOT}__container`
      });
      if (colorIndex) {
        containerClasses.push(`${BACKGROUND_COLOR_INDEX}-${colorIndex}`);
        containerClasses.push(this._backgroundContextClass(darkBackground));
      }
      if (containerClassName) {
        containerClasses.push(containerClassName);
      }
    } else if (colorIndex) {
      classes.push(`${BACKGROUND_COLOR_INDEX}-${colorIndex}`);
      classes.push(this._backgroundContextClass(darkBackground));
    }

    let a11yProps = {};
    let clickableProps = {};
    if (onClick) {
      classes.push(CLASS_ROOT + '--clickable');
      clickableProps = {
        onMouseDown: event => {
          this.setState({ mouseActive: true });
          if (onMouseDown) {
            onMouseDown(event);
          }
        },
        onMouseUp: event => {
          this.setState({ mouseActive: false });
          if (onMouseUp) {
            onMouseUp(event);
          }
        },
        onFocus: event => {
          if (mouseActive === false) {
            this.setState({ focus: true });
          }
          if (onFocus) {
            onFocus(event);
          }
        },
        onBlur: event => {
          this.setState({ focus: false });
          if (onBlur) {
            onBlur(event);
          }
        }
      };
      if (focusable) {
        if (this.state.focus) {
          classes.push(`${CLASS_ROOT}--focus`);
        }
        let boxLabel =
          typeof a11yTitle !== 'undefined'
            ? a11yTitle
            : Intl.getMessage(this.context.intl, 'Box');
        a11yProps.tabIndex = tabIndex || 0;
        a11yProps['aria-label'] = this.props['aria-label'] || boxLabel;
        a11yProps.role = role || 'group';
      }
    }

    let skipLinkAnchor;
    if (primary) {
      let mainContentLabel = Intl.getMessage(this.context.intl, 'Main Content');
      skipLinkAnchor = <SkipLinkAnchor label={mainContentLabel} />;
    }

    if (className) {
      classes.push(className);
    }

    let style = {};
    if (texture && 'string' === typeof texture) {
      if (texture.indexOf('url(') !== -1) {
        style.backgroundImage = texture;
      } else {
        style.backgroundImage = `url(${texture})`;
      }
    } else if (backgroundImage) {
      style.background = backgroundImage + ' no-repeat center center';
      style.backgroundSize = 'cover';
    }
    style = { ...style, ...restProps.style };
    let textureMarkup;
    if ('object' === typeof texture) {
      textureMarkup = <div className={CLASS_ROOT + '__texture'}>{texture}</div>;
    }

    let boxTitle = null;
    if (title && title.trim().length) {
      boxTitle = <span className={`${CLASS_ROOT}__title`}>{title}</span>;
    }

    let actionsBox = null;
    if (actions && actions.length) {
      actionsBox = (
        <div className={`${CLASS_ROOT}__actions-box`}>
          {actions.map((action, index) => {
            return (
              <div className={`${CLASS_ROOT}__action`} onClick={action.onClick}>
                {action.icon}
              </div>
            );
          })}
        </div>
      );
    }

    const Component = tag;
    if (appCentered) {
      return (
        <div
          {...restProps}
          ref={ref => (this.boxContainerRef = ref)}
          className={containerClasses.join(' ')}
          style={style}
          role={role}
          {...a11yProps}
          {...clickableProps}
        >
          {actionsBox}
          {skipLinkAnchor}
          {boxTitle}
          {boxTitle ? (
            <div className={`${CLASS_ROOT}__body`}>
              <Component id={id} className={classes.join(' ')}>
                {textureMarkup}
                {children}
              </Component>
            </div>
          ) : (
            <Component id={id} className={classes.join(' ')}>
              {textureMarkup}
              {children}
            </Component>
          )}
        </div>
      );
    } else {
      return (
        <Component
          {...restProps}
          ref={ref => (this.boxContainerRef = ref)}
          id={id}
          className={classes.join(' ')}
          style={style}
          role={role}
          tabIndex={tabIndex}
          onClick={onClick}
          {...a11yProps}
          {...clickableProps}
        >
          {actionsBox}
          {skipLinkAnchor}
          {textureMarkup}
          {boxTitle}
          {boxTitle ? (
            <div className={`${CLASS_ROOT}__body`}>{children}</div>
          ) : (
            children
          )}
        </Component>
      );
    }
  }
}

const FIXED_SIZES = ['xsmall', 'small', 'medium', 'large', 'xlarge', 'xxlarge'];
const RELATIVE_SIZES = ['full', '1/2', '1/3', '2/3', '1/4', '3/4'];
const SIZES = FIXED_SIZES.concat(RELATIVE_SIZES);
const MARGIN_SIZES = ['small', 'medium', 'large', 'none'];
const PAD_SIZES = ['small', 'medium', 'large', 'none'];

Box.propTypes = {
  a11yTitle: PropTypes.string,
  announce: PropTypes.bool,
  align: PropTypes.oneOf(['start', 'center', 'end', 'baseline', 'stretch']),
  alignContent: PropTypes.oneOf([
    'start',
    'center',
    'end',
    'between',
    'around',
    'stretch'
  ]),
  alignSelf: PropTypes.oneOf(['start', 'center', 'end', 'stretch']),
  appCentered: PropTypes.bool,
  backgroundImage: PropTypes.string,
  basis: PropTypes.oneOf(SIZES),
  colorIndex: PropTypes.string,
  containerClassName: PropTypes.string,
  direction: PropTypes.oneOf(['row', 'column']),
  focusable: PropTypes.bool,
  flex: PropTypes.oneOf(['grow', 'shrink', true, false]),
  full: PropTypes.oneOf([true, 'horizontal', 'vertical', false]),
  // remove in 1.0?
  onClick: PropTypes.func,
  justify: PropTypes.oneOf(['start', 'center', 'between', 'end']),
  margin: PropTypes.oneOfType([
    PropTypes.oneOf(MARGIN_SIZES),
    PropTypes.shape({
      bottom: PropTypes.oneOf(MARGIN_SIZES),
      horizontal: PropTypes.oneOf(MARGIN_SIZES),
      left: PropTypes.oneOf(MARGIN_SIZES),
      right: PropTypes.oneOf(MARGIN_SIZES),
      top: PropTypes.oneOf(MARGIN_SIZES),
      vertical: PropTypes.oneOf(MARGIN_SIZES)
    })
  ]),
  pad: PropTypes.oneOfType([
    PropTypes.oneOf(PAD_SIZES),
    PropTypes.shape({
      between: PropTypes.oneOf(PAD_SIZES),
      horizontal: PropTypes.oneOf(PAD_SIZES),
      vertical: PropTypes.oneOf(PAD_SIZES)
    })
  ]),
  primary: PropTypes.bool,
  reverse: PropTypes.bool,
  responsive: PropTypes.bool,
  role: PropTypes.string,
  separator: PropTypes.oneOf([
    'top',
    'bottom',
    'left',
    'right',
    'horizontal',
    'vertical',
    'all',
    'none'
  ]),
  size: PropTypes.oneOfType([
    PropTypes.oneOf([
      'auto',
      'xsmall',
      'small',
      'medium',
      'large',
      'xlarge',
      'xxlarge',
      'full'
    ]), // remove in 1.0?, use basis
    PropTypes.shape({
      height: PropTypes.oneOfType([
        PropTypes.oneOf(SIZES),
        PropTypes.shape({
          max: PropTypes.oneOf(FIXED_SIZES),
          min: PropTypes.oneOf(FIXED_SIZES)
        })
      ]),
      width: PropTypes.oneOfType([
        PropTypes.oneOf(SIZES),
        PropTypes.shape({
          max: PropTypes.oneOf(FIXED_SIZES),
          min: PropTypes.oneOf(FIXED_SIZES)
        })
      ])
    })
  ]),
  tag: PropTypes.string,
  title: PropTypes.string,
  textAlign: PropTypes.oneOf(['left', 'center', 'right']),
  texture: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  wrap: PropTypes.bool,
  card: PropTypes.bool,
  bordered: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      onClick: PropTypes.func.isRequired
    })
  ),
  actionSize: PropTypes.oneOfType(['large'])
};

Box.contextTypes = {
  intl: PropTypes.object
};

Box.defaultProps = {
  announce: false,
  direction: 'column',
  pad: 'none',
  tag: 'div',
  responsive: true,
  focusable: true,
  bordered: false
};
