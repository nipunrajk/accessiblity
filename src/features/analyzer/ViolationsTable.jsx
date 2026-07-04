import { Table, Badge, Text, Button, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function extractWCAGLevel(tags) {
  if (!tags) return null;
  if (tags.includes("wcag2aaa") || tags.includes("wcag21aaa")) return "AAA";
  if (
    tags.includes("wcag2aa") ||
    tags.includes("wcag21aa") ||
    tags.includes("wcag22aa")
  )
    return "AA";
  if (
    tags.includes("wcag2a") ||
    tags.includes("wcag21a") ||
    tags.includes("wcag22a")
  )
    return "A";
  return null;
}

export default function ViolationsTable({ violations = [] }) {
  if (!violations.length) return null;

  return (
    <Box maxHeight="60vh" style={{ overflow: 'auto' }}>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Issue</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Impact</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>WCAG</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {violations.map((violation) => {
            const impact = violation.impact || violation.severity || "moderate";
            const badgeColor =
              impact === 'critical' ? 'tomato' : impact === 'serious' ? 'amber' : 'gray';
            const wcagLevel = violation.wcagLevel || extractWCAGLevel(violation.tags);

            return (
              <Table.Row key={violation.id}>
                <Table.RowHeaderCell>
                  <Text as="div" size="2" weight="medium">
                    {violation.description}
                  </Text>
                  {(violation.help || violation.title) && (
                    <Text as="div" size="1" color="gray">
                      {violation.help || violation.title}
                    </Text>
                  )}
                </Table.RowHeaderCell>
                
                <Table.Cell>
                  <Badge color={badgeColor}>
                    {impact.charAt(0).toUpperCase() + impact.slice(1)}
                  </Badge>
                </Table.Cell>
                
                <Table.Cell>
                  {wcagLevel ? (
                    <Badge color="gray" variant="surface">
                      {wcagLevel}
                    </Badge>
                  ) : (
                    <Text size="1" color="gray">-</Text>
                  )}
                </Table.Cell>
                
                <Table.Cell>
                  <Button asChild variant="ghost" size="1" color="teal">
                    <Link to="/ai-fix">
                      View Fix <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
