import { Spinner, Flex, Text } from "@radix-ui/themes";

function LoadingState({ scanStats = {}, isAnalyzing = false }) {
  const { pagesScanned = 0, totalPages = 0, message = "" } = scanStats;

  let loadingMessage = "Loading your workspace...";
  
  if (isAnalyzing || pagesScanned > 0 || totalPages > 0) {
    loadingMessage = message || (totalPages === 0 
      ? "Initializing scan and discovering pages..." 
      : `Scanning ${pagesScanned} of ${totalPages} pages`);
  }

  return (
    <Flex direction="column" gap="4" align="center" justify="center" height="100vh">
      <Spinner size="3" />
      <Text size="3" color="gray">
        {loadingMessage}
      </Text>
    </Flex>
  );
}

export default LoadingState;
