/**
 * Category Section Groups
 * 
 * Maps high-level sections to their underlying quiz categories.
 * Used by the CategorySectionGrid component to organize the 3x3 selection grid.
 */

import { Cloud, Server, Ship, Box, Rocket, Network, Eye, Database, Terminal } from 'lucide-react'

export const CATEGORY_SECTIONS = [
  {
    id: 'cloud',
    name: 'Cloud',
    icon: Cloud,
    color: 'accent-secondary', // Cyan
    categories: [
      'Cloud - Fundamentals & Providers',
      'Cloud Design & Architecture',
      'AI/ML for DevOps',
    ],
  },
  {
    id: 'iac',
    name: 'IaC',
    icon: Server,
    color: 'accent-tertiary', // Violet
    categories: [
      'Infrastructure as Code & Provisioning',
    ],
  },
  {
    id: 'k8s',
    name: 'K8s',
    icon: Ship,
    color: 'accent-primary', // Fuchsia
    categories: [
      'Kubernetes - Core Concepts & Runtime',
      'Kubernetes - Scaling & Scheduling',
      'Service Mesh & Traffic Management',
    ],
  },
  {
    id: 'containers',
    name: 'Containers',
    icon: Box,
    color: 'accent-quaternary', // Pink
    categories: [
      'Containers - Concepts & Tooling',
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Rocket,
    color: 'accent-quinary', // Emerald
    categories: [
      'DevOps & CI/CD Systems',
      'Delivery, GitOps & Release Management',
      'Platform Engineering',
    ],
  },
  {
    id: 'network',
    name: 'Network',
    icon: Network,
    color: 'accent-secondary', // Cyan
    categories: [
      'Networking - Fundamentals & Theory',
      'Networking - Operations & Debugging',
      'Security & DevSecOps',
    ],
  },
  {
    id: 'observe',
    name: 'Observe',
    icon: Eye,
    color: 'accent-tertiary', // Violet
    categories: [
      'Observability & Reliability Engineering',
    ],
  },
  {
    id: 'data',
    name: 'Data',
    icon: Database,
    color: 'accent-primary', // Fuchsia
    categories: [
      'Messaging & Eventing Systems',
      'Databases & Storage Systems',
    ],
  },
  {
    id: 'core',
    name: 'Core',
    icon: Terminal,
    color: 'accent-quaternary', // Pink
    categories: [
      'Linux & Runtime Foundations',
      'Git & Version Control',
    ],
  },
]

/**
 * Get the section that contains a given category
 */
export const getSectionForCategory = (categoryName) => {
  return CATEGORY_SECTIONS.find(section => 
    section.categories.includes(categoryName)
  )
}

/**
 * Get all category names as a flat array
 */
export const getAllCategories = () => {
  return CATEGORY_SECTIONS.flatMap(section => section.categories)
}
