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
      'Cloud Fundamentals',
      'AWS Core Services',
      'AWS Platforms & Security',
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
      'Terraform',
      'IaC & Config Management',
    ],
  },
  {
    id: 'k8s',
    name: 'K8s',
    icon: Ship,
    color: 'accent-primary', // Fuchsia
    categories: [
      'Kubernetes Core',
      'Kubernetes Networking',
      'Kubernetes Storage',
      'Kubernetes Scheduling & Scaling',
      'Kubernetes Security',
      'Service Mesh',
    ],
  },
  {
    id: 'containers',
    name: 'Containers',
    icon: Box,
    color: 'accent-quaternary', // Pink
    categories: [
      'Containers',
      'Docker',
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery',
    icon: Rocket,
    color: 'accent-quinary', // Emerald
    categories: [
      'CI/CD Foundations',
      'CI/CD Platforms',
      'Helm & Kustomize',
      'ArgoCD & Flux',
      'Platform Engineering',
    ],
  },
  {
    id: 'network',
    name: 'Network',
    icon: Network,
    color: 'accent-secondary', // Cyan
    categories: [
      'Networking Fundamentals',
      'Network Tools & Troubleshooting',
      'Network Infrastructure',
      'Security Foundations',
      'Secrets & Policy',
      'AppSec & Supply Chain',
    ],
  },
  {
    id: 'observe',
    name: 'Observe',
    icon: Eye,
    color: 'accent-tertiary', // Violet
    categories: [
      'Metrics & Visualization',
      'Logging',
      'Tracing & Telemetry',
      'Reliability & On-Call',
    ],
  },
  {
    id: 'data',
    name: 'Data',
    icon: Database,
    color: 'accent-primary', // Fuchsia
    categories: [
      'Messaging & Streaming',
      "Relational DB's and Scaling",
      'NoSQL & Caching',
    ],
  },
  {
    id: 'core',
    name: 'Core',
    icon: Terminal,
    color: 'accent-quaternary', // Pink
    categories: [
      'Linux Fundamentals',
      'CLI & Text Tools',
      'Scripting & Automation',
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
