import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RtmpEndpoint, StreamingState, InsertRtmpEndpoint, Video } from "@shared/schema";
import { RtmpPanel } from "@/components/rtmp-panel";
import { StatusDashboard } from "@/components/status-dashboard";
import { Server, Wifi } from "lucide-react";

export default function Destinations() {
  const { toast } = useToast();

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<RtmpEndpoint[]>({
    queryKey: ["/api/rtmp-endpoints"],
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {/* RTMP endpoints */}
      <div className="console-pane rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-primary/10">
          <Server className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">RTMP Endpoints</span>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
          <span className="text-[9px] font-mono text-muted-foreground/40">{enabledEndpoints.length} active</span>
        </div>
        <RtmpPanel
          endpoints={endpoints}
          videos={videos}
          isLoading={endpointsLoading}
          onCreate={(endpoint: InsertRtmpEndpoint) => createEndpointMutation.mutate(endpoint)}
          onUpdate={(endpoint: RtmpEndpoint) => updateEndpointMutation.mutate(endpoint)}
          onDelete={(id: string) => deleteEndpointMutation.mutate(id)}
        />
      </div>

      {/* Endpoint status */}
      {enabledEndpoints.length > 0 && (
        <div className="console-pane rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-primary/10">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-primary/80">Endpoint Status</span>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
          </div>
          <StatusDashboard endpoints={enabledEndpoints} streamingState={streamingState} />
        </div>
      )}
    </div>
  );
}
