import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RtmpEndpoint, StreamingState, InsertRtmpEndpoint } from "@shared/schema";
import { RtmpPanel } from "@/components/rtmp-panel";
import { StatusDashboard } from "@/components/status-dashboard";
import { Terminal, ChevronRight, Server, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Destinations() {
  const { toast } = useToast();

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<RtmpEndpoint[]>({
    queryKey: ["/api/rtmp-endpoints"],
  });

  const { data: streamingState } = useQuery<StreamingState>({
    queryKey: ["/api/streaming/state"],
    refetchInterval: 2000,
  });

  const enabledEndpoints = endpoints.filter((e) => e.enabled);

  const createEndpointMutation = useMutation({
    mutationFn: async (endpoint: InsertRtmpEndpoint) =>
      apiRequest("POST", "/api/rtmp-endpoints", endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({ title: "Endpoint Added", description: "RTMP destination configured." });
    },
  });

  const updateEndpointMutation = useMutation({
    mutationFn: async ({ id, ...data }: RtmpEndpoint) =>
      apiRequest("PATCH", `/api/rtmp-endpoints/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
    },
  });

  const deleteEndpointMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/rtmp-endpoints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtmp-endpoints"] });
      toast({ title: "Endpoint Removed", description: "RTMP destination deleted." });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">root@endlesscast</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">destinations</span>
        <span className="animate-pulse">_</span>
      </div>

      <div className="space-y-4">
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-primary">&gt;</span> RTMP_ENDPOINTS
              <span className="ml-auto text-xs text-muted-foreground">
                [{enabledEndpoints.length} active]
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RtmpPanel
              endpoints={endpoints}
              isLoading={endpointsLoading}
              onCreate={(endpoint: InsertRtmpEndpoint) =>
                createEndpointMutation.mutate(endpoint)
              }
              onUpdate={(endpoint: RtmpEndpoint) =>
                updateEndpointMutation.mutate(endpoint)
              }
              onDelete={(id: string) => deleteEndpointMutation.mutate(id)}
            />
          </CardContent>
        </Card>

        {enabledEndpoints.length > 0 && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-primary">&gt;</span> ENDPOINT_STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusDashboard
                endpoints={enabledEndpoints}
                streamingState={streamingState}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
