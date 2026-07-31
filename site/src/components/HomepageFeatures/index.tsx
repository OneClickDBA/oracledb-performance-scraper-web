import type {ComponentType, ReactNode} from 'react';
import type {LucideProps} from 'lucide-react';
import {
  Box,
  ChartNoAxesCombined,
  Clock3,
  Database,
  Puzzle,
  ShieldCheck,
} from 'lucide-react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Icon: ComponentType<LucideProps>;
  description: string;
};

const features: FeatureItem[] = [
  {
    title: 'Long-term history',
    Icon: Clock3,
    description: 'Partitioned storage with configurable retention.',
  },
  {
    title: 'Complete visibility',
    Icon: ChartNoAxesCombined,
    description: 'SQL, sessions, waits, blocking, ASH and system metrics.',
  },
  {
    title: 'Troubleshoot faster',
    Icon: ShieldCheck,
    description: 'Correlate events and find root causes in seconds.',
  },
  {
    title: 'PostgreSQL powered',
    Icon: Database,
    description: 'Your data, your queries, with no proprietary lock-in.',
  },
  {
    title: 'Open and extensible',
    Icon: Puzzle,
    description: 'FOSS core with plugins and custom dashboards.',
  },
  {
    title: 'Deploy anywhere',
    Icon: Box,
    description: 'Linux service, Docker, Compose or Kubernetes.',
  },
];

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features} aria-label="Project capabilities">
      <div className={styles.featureGrid}>
        {features.map(({title, Icon, description}) => (
          <article className={styles.feature} key={title}>
            <Icon className={styles.featureIcon} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <Heading as="h3">{title}</Heading>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
