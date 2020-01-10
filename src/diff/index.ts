import { VNode, VNodeProps, LightType } from '../createElement';
import { simpleCloneDeepVNode } from '../util';
import { oldVNode as rootVNode } from '../App'; 

const createEmptyVNode = () => {
  return {
    props: {},
    children: []
  }
}

const appendChild = (parant: VNode, vnode: VNode) => {
  let isNew = -1;
  for (let i = 0; i < parant.children.length; i++) {
    const childVNode = parant.children[i];
    if (childVNode === vnode) {
      isNew = i
      break
    }
  }
  if (isNew === -1) {
    parant.children.push(vnode);
    snapshots.push({
      describe: `添加节点${vnode.type}`,
      vnode: simpleCloneDeepVNode(rootVNode)
    });
  } else {
    parant.children.splice(isNew, 1);
    parant.children.push(vnode);
    snapshots.push({
      describe: `移动节点${vnode.type}`,
      vnode: simpleCloneDeepVNode(rootVNode)
    });
  }
}

const insertBefore = () => {
}

const getNextBrother = () => {
}

const unmount = (parant: VNode, vnode: VNode) => {
  for (let i = 0; i < parant.children.length; i++) {
    const childVNode = parant.children[i];
    if (
      childVNode === vnode &&
      (vnode as any).reuse === false
    ) {
      vnode.light = LightType.DELETE;
      snapshots.push({
        describe: `删除节点${vnode.type}`,
        vnode: simpleCloneDeepVNode(rootVNode)
      });
      parant.children.splice(i, 1);
    }
  }
}

export interface ISnapshot {
  describe: string;
  vnode: VNode;
}

export const snapshots:ISnapshot[] = []

const setProperty = (vnode: VNode, key: string, value: any, oldValue?: any) => {
  if (value === null || value === false) {
    vnode.light = LightType.DELETE;
    snapshots.push({
      describe: `删除属性${key}`,
      vnode: simpleCloneDeepVNode(rootVNode)
    });
    delete vnode.props[key];
    delete vnode.light
  } else {
    vnode.props[key] = value;
    vnode.light = LightType.CHANGE;
    snapshots.push({
      describe: `${oldValue == undefined ? '添加属性' : '修改属性'}${key}, 由${oldValue}到${value}`,
      vnode: simpleCloneDeepVNode(rootVNode)
    });
  }
}

export const diffElementNodes = (newVNode: VNode, oldVNode: VNode): VNode => {
  const newProps = newVNode.props;
  const oldProps = oldVNode.props || {};
  if (oldVNode.type == undefined) {
    oldVNode.type = newVNode.type;
    snapshots.push({
      describe: `创建节点${newVNode.type}`,
      vnode: simpleCloneDeepVNode(rootVNode)
    });
  }
  diffProps(oldVNode, newProps, oldProps);
  diffChildren(newVNode, oldVNode);
  return oldVNode;
}

export const diffProps = (vnode: VNode, newProps: VNodeProps, oldProps: VNodeProps) => {
  for (let key in oldProps) {
    if (!(key in newProps)) {
      setProperty(vnode, key, null)
    }
  }
  for (let key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      setProperty(vnode, key, newProps[key], oldProps[key])
    }
  }
}

export const diffChildren = (newParentVNode: VNode, oldParentVNode: VNode) => {
  let oldChildren = oldParentVNode.children;
  let newChildren = newParentVNode.children;
  for (let i = 0; i < oldChildren.length; i++) {
    (oldChildren[i] as any).reuse = false
  }
  for (let i = 0; i < newChildren.length; i++) {
    let childVNode = newChildren[i];
    let oldVNode;
    if (childVNode != null) {
      oldVNode = oldChildren[i];
      if (
        oldVNode &&
        oldVNode.props.key === childVNode.props.key &&
        oldVNode.type === childVNode.type
      ) {
        (oldChildren[i] as any).reuse = true
      } else {
        for (let j = 0; j < oldChildren.length; j++) {
          oldVNode = oldChildren[j];
          if (
            oldVNode &&
            oldVNode.props.key === childVNode.props.key &&
            oldVNode.type === childVNode.type &&
            !(oldVNode as any).reuse
          ) {
            (oldChildren[j] as any).reuse = true
            break
          }
          oldVNode = null;
        }
      }
      const EMPTY_OBJ = createEmptyVNode();
      oldVNode = oldVNode || EMPTY_OBJ;
      let vnode = diff(childVNode, oldVNode as any);
      outer: if (
        vnode === EMPTY_OBJ as any
      ) {
        appendChild(oldParentVNode, vnode)
      } else {
        insertBefore()
      }
    }
  }
  for (let i = 0; i < oldChildren.length; i++) {
    unmount(oldParentVNode, oldChildren[i]);
  }
}

export const diff = (newVNode: VNode, oldVNode: VNode): VNode => {
  return diffElementNodes(newVNode, oldVNode);
}
