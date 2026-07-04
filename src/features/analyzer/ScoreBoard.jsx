import { Grid, Card, Text, Progress, Flex } from '@radix-ui/themes';

export default function ScoreBoard({ data }) {
  if (!data || !data.scores) return null;

  return (
    <Grid columns={{ initial: '1', md: '3' }} gap="4">
      {Object.entries(data.scores).map(([key, value]) => {
        const color = value > 90 ? 'jade' : value > 50 ? 'amber' : 'tomato';
        return (
          <Card key={key} variant="surface">
            <Flex direction="column" gap="4">
              <Text size="2" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Text>
              
              <Flex align="baseline" gap="2">
                <Text size="6" weight="bold" color={color}>
                  {value}
                </Text>
                <Text size="3" color="gray" weight="medium">
                  /100
                </Text>
              </Flex>
              
              <Progress 
                value={value} 
                color={color}
              />
            </Flex>
          </Card>
        );
      })}
    </Grid>
  );
}
