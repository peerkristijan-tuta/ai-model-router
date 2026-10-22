package com.example.router;

import java.util.ArrayList;
import java.util.List;
import java.io.IOException;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.TextBlock;
import com.anthropic.models.messages.ToolUseBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.ImageBlockParam;
import com.anthropic.models.messages.DocumentBlockParam;
import com.anthropic.models.messages.TextBlockParam;

@RestController
@SpringBootApplication
public class RouterApplication {

	public static void main(String[] args) {
		SpringApplication.run(RouterApplication.class, args);
	}

	private boolean uploaded = false;
	private String model = null;
	private String currentStream = "";
	private volatile int requestVersion = 0;
	private boolean answerStatus = false;
	private boolean latestAnswerAvailable = false;

	@GetMapping("/receiveUploadConfirmation")
	public boolean sendUploadConfirmation() {
		if (uploaded) {
			uploaded = false;
			return true;
		}
		return false;
	}

	@GetMapping("/receiveAnswerStatus")
	public boolean receiveAnswerStatus() {
		if (latestAnswerAvailable) {
			latestAnswerAvailable = false;
			return true;
		}
		return answerStatus;
	}

	@GetMapping("/receiveModelConfirmation")
	public String sendModelConfirmation() {
		return model;
	}

	@GetMapping("/receiveAnswer")
	public String sendAnswer() {
		return currentStream;
	} 
	
	private void streamResponse(AnthropicClient client, String model, List<ContentBlockParam> blockParams, int myVersion) throws Exception {
		try (var stream = client.messages().createStreaming(
			MessageCreateParams.builder()
				.model(model)
				.maxTokens(1024L)
				.system("Keep your response within 1024 tokens")
				.addUserMessageOfBlockParams(blockParams)
				.build()
		)) {
			stream.stream().forEach(event -> {
				event.contentBlockDelta().ifPresent(delta -> {
					delta.delta().text().ifPresent(text -> {
						if (requestVersion != myVersion) return;
						currentStream += text.text();
						latestAnswerAvailable = true;
					});
				});
			});
		}
	}

	@PostMapping("/prompt")
	public void receivePrompt(@RequestParam("prompt") String prompt, @RequestParam(value="files", required=false) ArrayList<MultipartFile> files) throws Exception {
		final int myVersion = ++requestVersion;
		uploaded = false;
		model = null;
		currentStream = "";
		AnthropicClient client = AnthropicOkHttpClient.builder()
			.apiKey("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")
			.build();

		List<ContentBlockParam> blockParams = new ArrayList<>();
		blockParams.add(ContentBlockParam.ofText(TextBlockParam.builder().text(prompt).build()));

		if (files != null) {
			for (MultipartFile file : files) {
				String encoded = java.util.Base64.getEncoder().encodeToString(file.getBytes());
				String mediaType = file.getContentType();
				System.out.println(mediaType); 
				if (mediaType.startsWith("image/")) {
					blockParams.add(ContentBlockParam.ofImage(
						ImageBlockParam.builder()
							.source(ImageBlockParam.Source.ofBase64(
								com.anthropic.models.messages.Base64ImageSource.builder()
									.data(encoded)
									.mediaType(com.anthropic.models.messages.Base64ImageSource.MediaType.of(mediaType))
									.build()
							))
							.build()
					));
				} else if (mediaType.startsWith("application/pdf")) {
					blockParams.add(ContentBlockParam.ofDocument(
						DocumentBlockParam.builder()
							.base64Source(encoded)
							.build()
					));
				} else if (mediaType.startsWith("text/") || mediaType.startsWith("application/octet-stream")) {
					blockParams.add(ContentBlockParam.ofText(
						TextBlockParam.builder().text(new String(file.getBytes())).build()
					));
				}
			}
		}

		uploaded = true;
		if (requestVersion != myVersion) return;

		Message response = client.messages().create(
			MessageCreateParams.builder()
				.model("claude-sonnet-4-5")
				.maxTokens(5L)
				.system("You are evaluating the complexity of a prompt and attached images. Reply 1, 2, or 3 to route to respectably powerful, moderately powerful, and very powerful LLM. Your bias must be strongly in favor of choosing the least powerful LLM but you're also realistic and will assign a higher LLM if not doing so would threaten the coherence of the whaanswer by the LLM. One number reply")
				.addUserMessageOfBlockParams(blockParams)
				.build()
		);

		String result = response.content().get(0).text().map(t -> t.text()).orElse("");
		if (requestVersion != myVersion) return;

		switch (result) {
			case "1":
				if (requestVersion == myVersion) answerStatus = true;
				model = "Haiku";
				streamResponse(client, "claude-haiku-4-5", blockParams, myVersion);
				if (requestVersion == myVersion) answerStatus = false;
				break;
			case "2":
				if (requestVersion == myVersion) answerStatus = true;
				model = "Sonnet";
				streamResponse(client, "claude-sonnet-4-5", blockParams, myVersion);
				if (requestVersion == myVersion) answerStatus = false;
				break;
			default: // case 3
				if (requestVersion == myVersion) answerStatus = true;
				model = "Opus";
				streamResponse(client, "claude-opus-4-5", blockParams, myVersion);
				if (requestVersion == myVersion) answerStatus = false;
				break;
		}
	}
}