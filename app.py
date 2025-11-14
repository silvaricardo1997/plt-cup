import streamlit as st
import pandas as pd
from datetime import date
import os
import uuid
import qrcode
from io import BytesIO

# ========= CONFIGURAÇÕES =========
ARQUIVO_DADOS = "cuppings_pilotis.csv"
ARQUIVO_SALAS = "salas_cupping.csv"
ARQUIVO_AMOSTRAS = "amostras_cupping.csv"
ADMIN_PASSWORD = "pilotis-admin"  # TROCAR ISSO DEPOIS :)

st.set_page_config(
    page_title="PLT Cupping - Pilotis Cafés Especiais",
    layout="centered"
)

# ========= FUNÇÕES DE DADOS =========
def carregar_dados():
    if os.path.exists(ARQUIVO_DADOS):
        return pd.read_csv(ARQUIVO_DADOS)
    else:
        return pd.DataFrame()

def salvar_registro(registro: dict):
    df = carregar_dados()
    df = pd.concat([df, pd.DataFrame([registro])], ignore_index=True)
    df.to_csv(ARQUIVO_DADOS, index=False)

def carregar_salas():
    if os.path.exists(ARQUIVO_SALAS):
        return pd.read_csv(ARQUIVO_SALAS)
    else:
        return pd.DataFrame(columns=[
            "sala_id", "nome_sala", "data_cupping",
            "tipo_ficha", "criado_por", "observacoes"
        ])

def salvar_sala(sala: dict):
    df = carregar_salas()
    df = pd.concat([df, pd.DataFrame([sala])], ignore_index=True)
    df.to_csv(ARQUIVO_SALAS, index=False)

def carregar_amostras():
    if os.path.exists(ARQUIVO_AMOSTRAS):
        return pd.read_csv(ARQUIVO_AMOSTRAS)
    else:
        return pd.DataFrame(columns=[
            "amostra_id", "sala_id", "codigo_amostra",
            "descricao", "ordem_mesa"
        ])

def salvar_amostra(amostra: dict):
    df = carregar_amostras()
    df = pd.concat([df, pd.DataFrame([amostra])], ignore_index=True)
    df.to_csv(ARQUIVO_AMOSTRAS, index=False)

def gerar_qr_code(url: str):
    qr = qrcode.QRCode(
        version=1,
        box_size=8,
        border=2
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

# ========= HELPERS =========
def slider_sca(label: str, key: str, default: float = 8.0):
    # Escala oficial: 6.00–10.00, passos de 0.25
    return st.slider(label, 6.0, 10.0, default, 0.25, key=key)

def pontos_xicaras(qtd_ok: int, total_cups: int = 5):
    # Padrão SCA/CQI: 2 pontos por xícara boa, até 10
    qtd_ok = max(0, min(qtd_ok, total_cups))
    return qtd_ok * 2.0

# ========= TÍTULO =========
st.title("☕ PLT Cupping – Pilotis Cafés Especiais")
st.write("Sistema interno para avaliação de qualidade de bebida – arábicas (SCA) e canéforas (Fine Robusta).")

# Query params (para modo avaliador via link / QR)
query_params = st.experimental_get_query_params()
sala_param = query_params.get("sala", [None])[0]

# ========= SIDEBAR =========
st.sidebar.header("Modo de uso")

if sala_param:
    modo = "Avaliador (via sala)"
else:
    modo = st.sidebar.radio(
        "Selecione o modo",
        ["Avaliador", "Administrador"]
    )

# ========= FORMULÁRIOS DE AVALIAÇÃO =========

def formulario_arabica_sca(sala_id=None, nome_sala=None,
                           amostra_id=None, codigo_amostra=None,
                           amostra_descricao=None):
    """Formulário alinhado ao protocolo SCA Arabica Cupping Form."""
    prefix = f"arabica_{amostra_id}_"

    if codigo_amostra:
        st.markdown(f"#### Amostra {codigo_amostra}")
        if amostra_descricao:
            st.caption(amostra_descricao)

    data_cupping = st.date_input("Data do cupping", value=date.today(), key=prefix+"data")
    avaliador = st.text_input("Seu nome (avaliador)", key=prefix+"avaliador")

    st.markdown("##### Metadados da amostra")
    produtor = st.text_input("Produtor / Fazenda", key=prefix+"produtor")
    origem_regiao = st.text_input("Origem / Região", key=prefix+"origem")
    especie = "Arábica"
    variedade = st.text_input("Variedade", key=prefix+"variedade")
    processo = st.text_input("Processo (natural, CD, lavado, experimental...)", key=prefix+"processo")
    safra = st.text_input("Safra", key=prefix+"safra")
    torra_info = st.text_area("Informações da torra (data, perfil, notas)", key=prefix+"torra")

    st.markdown("---")
    st.markdown("##### Configuração da mesa")
    total_cups = st.number_input("Número de xícaras na mesa", 1, 10, 5, key=prefix+"total_cups")

    st.markdown("##### Atributos de qualidade (SCA)")
    fragrance_aroma = slider_sca("Fragrance / Aroma", key=prefix+"fragrancia", default=8.25)
    flavor = slider_sca("Flavor", key=prefix+"flavor", default=8.25)
    aftertaste = slider_sca("Aftertaste", key=prefix+"aftertaste", default=8.0)
    acidity = slider_sca("Acidity", key=prefix+"acidez", default=8.0)
    body = slider_sca("Body", key=prefix+"corpo", default=8.0)
    balance = slider_sca("Balance", key=prefix+"balanco", default=8.0)
    overall = slider_sca("Overall", key=prefix+"overall", default=8.0)

    st.markdown("##### Uniformity / Clean Cup / Sweetness (por xícara boa)")
    u_ok = st.number_input("Uniformity – nº de xícaras boas", 0, total_cups, total_cups, key=prefix+"u_ok")
    c_ok = st.number_input("Clean Cup – nº de xícaras boas", 0, total_cups, total_cups, key=prefix+"c_ok")
    s_ok = st.number_input("Sweetness – nº de xícaras boas", 0, total_cups, total_cups, key=prefix+"s_ok")

    uniformity = pontos_xicaras(u_ok, total_cups)
    clean_cup = pontos_xicaras(c_ok, total_cups)
    sweetness = pontos_xicaras(s_ok, total_cups)

    st.caption(f"Uniformity: {uniformity:.2f} | Clean Cup: {clean_cup:.2f} | Sweetness: {sweetness:.2f}")

    st.markdown("##### Defeitos (SCA)")
    taint_cups = st.number_input("Taint – nº de xícaras", 0, total_cups, 0, key=prefix+"taint")
    fault_cups = st.number_input("Fault – nº de xícaras", 0, total_cups, 0, key=prefix+"fault")

    defects = taint_cups * 2.0 + fault_cups * 4.0

    st.markdown("##### Descritores e comentários")
    descritores = st.text_area("Descritores aromáticos / sensoriais", key=prefix+"descritores")
    comentarios = st.text_area("Comentários gerais (torra, potencial de uso, blend etc.)", key=prefix+"comentarios")

    qualidade = [
        fragrance_aroma,
        flavor,
        aftertaste,
        acidity,
        body,
        balance,
        uniformity,
        clean_cup,
        sweetness,
        overall
    ]
    total_quality = sum(qualidade)
    final_score = total_quality - defects

    st.markdown(f"**Nota final SCA desta amostra: {final_score:.2f}**")

    if st.button("Salvar avaliação desta amostra", key=prefix+"salvar"):
        registro = {
            "id": str(uuid.uuid4()),
            "protocolo": "SCA Arabica",
            "sala_id": sala_id,
            "nome_sala": nome_sala,
            "amostra_id": amostra_id,
            "codigo_amostra": codigo_amostra,
            "amostra_descricao": amostra_descricao,
            "data_cupping": data_cupping.isoformat(),
            "avaliador": avaliador,
            "tipo_ficha": "Arábica (SCA)",
            "produtor": produtor,
            "origem_regiao": origem_regiao,
            "especie": especie,
            "variedade": variedade,
            "processo": processo,
            "safra": safra,
            "torra_info": torra_info,
            "total_cups": total_cups,
            "fragrance_aroma": fragrance_aroma,
            "flavor": flavor,
            "aftertaste": aftertaste,
            "acidity": acidity,
            "body": body,
            "balance": balance,
            "uniformity": uniformity,
            "clean_cup": clean_cup,
            "sweetness": sweetness,
            "overall": overall,
            "u_ok": u_ok,
            "c_ok": c_ok,
            "s_ok": s_ok,
            "taint_cups": taint_cups,
            "fault_cups": fault_cups,
            "defects_total": defects,
            "nota_final": final_score,
            "descritores": descritores,
            "comentarios": comentarios,
        }
        salvar_registro(registro)
        st.success("Avaliação desta amostra (SCA) salva com sucesso!")
        return True, final_score

    return False, final_score

def formulario_canephora_fine_robusta(sala_id=None, nome_sala=None,
                                      amostra_id=None, codigo_amostra=None,
                                      amostra_descricao=None):
    """Formulário alinhado ao CQI Fine Robusta (estrutura de atributos)."""
    prefix = f"canephora_{amostra_id}_"

    if codigo_amostra:
        st.markdown(f"#### Amostra {codigo_amostra}")
        if amostra_descricao:
            st.caption(amostra_descricao)

    data_cupping = st.date_input("Data do cupping", value=date.today(), key=prefix+"data")
    avaliador = st.text_input("Seu nome (avaliador)", key=prefix+"avaliador")

    st.markdown("##### Metadados da amostra")
    produtor = st.text_input("Produtor / Fazenda", key=prefix+"produtor")
    origem_regiao = st.text_input("Origem / Região", key=prefix+"origem")
    especie = "Canéfora"
    variedade = st.text_input("Variedade", key=prefix+"variedade")
    processo = st.text_input("Processo (natural, CD, lavado, experimental...)", key=prefix+"processo")
    safra = st.text_input("Safra", key=prefix+"safra")
    torra_info = st.text_area("Informações da torra (data, perfil, notas)", key=prefix+"torra")

    st.markdown("---")
    st.markdown("##### Configuração da mesa")
    total_cups = st.number_input("Número de xícaras na mesa", 1, 10, 5, key=prefix+"total_cups")

    st.markdown("##### Atributos de qualidade (Fine Robusta)")
    fragrance_aroma = slider_sca("Fragrance / Aroma", key=prefix+"fragrancia", default=8.25)
    flavor = slider_sca("Flavor", key=prefix+"flavor", default=8.25)
    aftertaste = slider_sca("Aftertaste", key=prefix+"aftertaste", default=8.0)
    salt_acid = slider_sca("Salt / Acid", key=prefix+"salt_acid", default=8.0)
    bitter_sweet = slider_sca("Bitter / Sweet", key=prefix+"bitter_sweet", default=8.0)
    mouthfeel = slider_sca("Mouthfeel", key=prefix+"mouthfeel", default=8.0)
    balance = slider_sca("Balance", key=prefix+"balanco", default=8.0)
    overall = slider_sca("Overall", key=prefix+"overall", default=8.0)

    st.markdown("##### Uniform Cups / Clean Cups (por xícara boa)")
    u_ok = st.number_input("Uniform Cups – nº de xícaras boas", 0, total_cups, total_cups, key=prefix+"u_ok")
    c_ok = st.number_input("Clean Cups – nº de xícaras boas", 0, total_cups, total_cups, key=prefix+"c_ok")

    uniform_cups = pontos_xicaras(u_ok, total_cups)
    clean_cups = pontos_xicaras(c_ok, total_cups)

    st.caption(f"Uniform Cups: {uniform_cups:.2f} | Clean Cups: {clean_cups:.2f}")

    st.markdown("##### Defeitos (CQI Fine Robusta – Taint/Fault)")
    taint_cups = st.number_input("Taint – nº de xícaras", 0, total_cups, 0, key=prefix+"taint")
    fault_cups = st.number_input("Fault – nº de xícaras", 0, total_cups, 0, key=prefix+"fault")

    defects = taint_cups * 2.0 + fault_cups * 4.0

    st.markdown("##### Descritores e comentários")
    descritores = st.text_area("Descritores aromáticos / sensoriais", key=prefix+"descritores")
    comentarios = st.text_area("Comentários gerais (torra, potencial de uso, blend etc.)", key=prefix+"comentarios")

    qualidade = [
        fragrance_aroma,
        flavor,
        aftertaste,
        salt_acid,
        bitter_sweet,
        mouthfeel,
        balance,
        uniform_cups,
        clean_cups,
        overall
    ]
    total_quality = sum(qualidade)
    final_score = total_quality - defects

    st.markdown(f"**Nota final Fine Robusta desta amostra: {final_score:.2f}**")

    if st.button("Salvar avaliação desta amostra", key=prefix+"salvar"):
        registro = {
            "id": str(uuid.uuid4()),
            "protocolo": "CQI Fine Robusta",
            "sala_id": sala_id,
            "nome_sala": nome_sala,
            "amostra_id": amostra_id,
            "codigo_amostra": codigo_amostra,
            "amostra_descricao": amostra_descricao,
            "data_cupping": data_cupping.isoformat(),
            "avaliador": avaliador,
            "tipo_ficha": "Canéfora (Fine Robusta)",
            "produtor": produtor,
            "origem_regiao": origem_regiao,
            "especie": especie,
            "variedade": variedade,
            "processo": processo,
            "safra": safra,
            "torra_info": torra_info,
            "total_cups": total_cups,
            "fragrance_aroma": fragrance_aroma,
            "flavor": flavor,
            "aftertaste": aftertaste,
            "salt_acid": salt_acid,
            "bitter_sweet": bitter_sweet,
            "mouthfeel": mouthfeel,
            "balance": balance,
            "overall": overall,
            "uniform_cups": uniform_cups,
            "clean_cups": clean_cups,
            "u_ok": u_ok,
            "c_ok": c_ok,
            "taint_cups": taint_cups,
            "fault_cups": fault_cups,
            "defects_total": defects,
            "nota_final": final_score,
            "descritores": descritores,
            "comentarios": comentarios,
        }
        salvar_registro(registro)
        st.success("Avaliação desta amostra (Fine Robusta) salva com sucesso!")
        return True, final_score

    return False, final_score

# ========= MODO ADMINISTRADOR =========
if modo == "Administrador":
    st.sidebar.subheader("Autenticação de admin")
    admin_input = st.sidebar.text_input("Senha de administrador", type="password")
    if admin_input != ADMIN_PASSWORD:
        st.warning("Digite a senha de administrador para acessar as funções de admin.")
        st.stop()

    st.subheader("👑 Administração – Salas de Cupping")

    # Formulário para criar sala
    with st.form("form_criar_sala"):
        st.markdown("### Criar nova sala de cupping")
        nome_sala = st.text_input("Nome da sala (ex.: Cupping Arábicas Mantiqueira)")
        data_sala = st.date_input("Data do cupping", value=date.today())
        tipo_ficha = st.selectbox(
            "Tipo de ficha padrão",
            ["Arábica (SCA)", "Canéfora (Fine Robusta CQI)"]
        )
        criado_por = st.text_input("Criado por", value="")
        observacoes = st.text_area("Observações da sala (opcional)")

        base_url = st.text_input(
            "URL base da aplicação (para gerar link do QR)",
            value="http://localhost:8501"
        )

        submitted = st.form_submit_button("Criar sala")

    if submitted:
        if not nome_sala:
            st.error("Informe um nome para a sala.")
        else:
            sala_id = str(uuid.uuid4())[:8]  # ID curtinho
            sala = {
                "sala_id": sala_id,
                "nome_sala": nome_sala,
                "data_cupping": data_sala.isoformat(),
                "tipo_ficha": tipo_ficha,
                "criado_por": criado_por,
                "observacoes": observacoes
            }
            salvar_sala(sala)

            link_sala = f"{base_url}?sala={sala_id}"

            st.success(f"Sala criada com sucesso! ID: {sala_id}")
            st.write("Link da sala para avaliadores:")
            st.code(link_sala, language="text")

            # QR Code
            st.markdown("### QR Code da sala")
            buf = gerar_qr_code(link_sala)
            st.image(buf, caption="Escaneie para acessar a sala de cupping", use_column_width=False)

            st.download_button(
                label="Baixar QR Code (PNG)",
                data=buf,
                file_name=f"qr_sala_{sala_id}.png",
                mime="image/png"
            )

    # Listagem das salas já criadas
    st.markdown("---")
    st.markdown("### Salas cadastradas")

    df_salas = carregar_salas()
    if df_salas.empty:
        st.info("Nenhuma sala criada ainda.")
    else:
        st.dataframe(df_salas)

    # ===== CADASTRO DE AMOSTRAS POR SALA =====
    st.markdown("---")
    st.markdown("### Cadastro de amostras das salas")

    if df_salas.empty:
        st.info("Crie uma sala antes de cadastrar amostras.")
    else:
        df_amostras = carregar_amostras()

        with st.form("form_cadastrar_amostra"):
            sala_escolhida_nome = st.selectbox(
                "Sala",
                options=df_salas["nome_sala"],
                help="Selecione a sala para a qual as amostras serão cadastradas."
            )
            sala_row = df_salas[df_salas["nome_sala"] == sala_escolhida_nome].iloc[0]
            sala_id_sel = sala_row["sala_id"]

            codigo_amostra = st.text_input("Código da amostra (ex.: A1, B2, 01)")
            descricao = st.text_input("Descrição da amostra (opcional)")
            ordem_mesa = st.number_input("Ordem na mesa (posição)", 1, 100, 1)

            submitted_amostra = st.form_submit_button("Adicionar amostra")

        if submitted_amostra:
            if not codigo_amostra:
                st.error("Informe um código para a amostra.")
            else:
                amostra = {
                    "amostra_id": str(uuid.uuid4())[:8],
                    "sala_id": sala_id_sel,
                    "codigo_amostra": codigo_amostra,
                    "descricao": descricao,
                    "ordem_mesa": ordem_mesa
                }
                salvar_amostra(amostra)
                st.success("Amostra adicionada com sucesso!")

        # Listar amostras já cadastradas para a sala escolhida
        df_amostras = carregar_amostras()
        if not df_amostras.empty:
            st.markdown("#### Amostras cadastradas para a sala selecionada")
            amostras_sala = df_amostras[df_amostras["sala_id"] == sala_id_sel].sort_values("ordem_mesa")
            if amostras_sala.empty:
                st.info("Nenhuma amostra cadastrada para esta sala ainda.")
            else:
                st.dataframe(amostras_sala)

# ========= MODO AVALIADOR (SEM SALA) =========
if modo == "Avaliador":
    st.subheader("👤 Modo avaliador (sem sala vinculada)")
    protocolo = st.radio(
        "Escolha o protocolo",
        ["Arábica (SCA)", "Canéfora (Fine Robusta CQI)"]
    )

    codigo_amostra = st.text_input("Código da amostra (opcional)")
    amostra_descricao = st.text_input("Descrição da amostra (opcional)")

    if protocolo.startswith("Arábica"):
        formulario_arabica_sca(
            sala_id=None,
            nome_sala=None,
            amostra_id="livre_arabica",
            codigo_amostra=codigo_amostra,
            amostra_descricao=amostra_descricao
        )
    else:
        formulario_canephora_fine_robusta(
            sala_id=None,
            nome_sala=None,
            amostra_id="livre_canephora",
            codigo_amostra=codigo_amostra,
            amostra_descricao=amostra_descricao
        )

# ========= MODO AVALIADOR VIA SALA (QR / LINK) =========
if modo == "Avaliador (via sala)" and sala_param:
    df_salas = carregar_salas()
    sala_info = df_salas[df_salas["sala_id"] == sala_param]

    if sala_info.empty:
        st.error("Sala não encontrada. Verifique se o link/QR está correto.")
    else:
        sala = sala_info.iloc[0]
        st.subheader(f"👤 Modo avaliador – Sala: {sala['nome_sala']}")
        st.caption(f"Data: {sala['data_cupping']} | Protocolo: {sala['tipo_ficha']}")

        # Carregar amostras da sala
        df_amostras = carregar_amostras()
        amostras_sala = df_amostras[df_amostras["sala_id"] == sala_param].sort_values("ordem_mesa")

        if amostras_sala.empty:
            st.info("Ainda não há amostras cadastradas para esta sala. Aguarde o admin finalizar a configuração.")
        else:
            # Controle de progresso do avaliador na sala
            if "sala_atual" not in st.session_state or st.session_state["sala_atual"] != sala_param:
                st.session_state["sala_atual"] = sala_param
                st.session_state["amostra_index"] = 0

            idx = st.session_state["amostra_index"]
            total = len(amostras_sala)

            if idx >= total:
                st.success("Você já avaliou todas as amostras desta sala. Obrigado!")
            else:
                amostra_atual = amostras_sala.iloc[idx]
                st.markdown(
                    f"### Amostra {amostra_atual['codigo_amostra']} – posição "
                    f"{int(amostra_atual['ordem_mesa'])} na mesa"
                )
                if amostra_atual["descricao"]:
                    st.caption(amostra_atual["descricao"])

                if sala["tipo_ficha"].startswith("Arábica"):
                    avancar, nota = formulario_arabica_sca(
                        sala_id=sala["sala_id"],
                        nome_sala=sala["nome_sala"],
                        amostra_id=amostra_atual["amostra_id"],
                        codigo_amostra=amostra_atual["codigo_amostra"],
                        amostra_descricao=amostra_atual["descricao"]
                    )
                else:
                    avancar, nota = formulario_canephora_fine_robusta(
                        sala_id=sala["sala_id"],
                        nome_sala=sala["nome_sala"],
                        amostra_id=amostra_atual["amostra_id"],
                        codigo_amostra=amostra_atual["codigo_amostra"],
                        amostra_descricao=amostra_atual["descricao"]
                    )

                st.markdown(f"Progresso: **{idx+1} / {total}**")

                if avancar:
                    st.session_state["amostra_index"] += 1
                    st.experimental_rerun()

# ========= HISTÓRICO =========
st.markdown("---")
st.subheader("Histórico geral de cuppings (todas as salas)")

df_all = carregar_dados()
if not df_all.empty:
    st.dataframe(df_all.sort_values("data_cupping", ascending=False))
    st.download_button(
        label="Baixar dados em CSV",
        data=df_all.to_csv(index=False).encode("utf-8"),
        file_name="cuppings_pilotis.csv",
        mime="text/csv",
    )
else:
    st.info("Nenhuma avaliação registrada ainda.")
